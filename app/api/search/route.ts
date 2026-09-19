import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/api/serverEnv";
import { forwardJsonResponse } from "@/lib/api/proxy";
import { getMatchingFakeProfiles } from "@/lib/fakeProfiles";
import type { SearchProfile, SearchResponse } from "@/lib/search";

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

function isOnlineNow(profile: SearchProfile): boolean {
  return (
    typeof profile.lastSeen === "number" &&
    Number.isFinite(profile.lastSeen) &&
    Date.now() - profile.lastSeen < ONLINE_WINDOW_MS
  );
}

/** Index right after the last online profile — scanning from the end so fakes land right
 * where the online block ends, wherever that is. No online profiles at all → falls through
 * to items.length (append at the very end, after the real offline profiles, not ahead of
 * them). Empty items → also items.length (0), so fakes become the only entries. */
function insertionIndexAfterOnlineBlock(items: SearchProfile[]): number {
  for (let i = items.length - 1; i >= 0; i--) {
    if (isOnlineNow(items[i])) return i + 1;
  }
  return items.length;
}

export async function GET(request: NextRequest) {
  const apiBaseUrl = serverEnv("API_BASE_URL");
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: "Server is missing API_BASE_URL." },
      { status: 500 },
    );
  }

  const upstreamUrl = new URL("/search", apiBaseUrl);
  const params = request.nextUrl.searchParams;
  for (const [key, value] of params.entries()) {
    upstreamUrl.searchParams.set(key, value);
  }

  const auth = request.headers.get("authorization");

  try {
    const response = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok || params.get("nextToken")) {
      // Fake profiles are only spliced into the first page — never appended past it,
      // which would duplicate them across "load more" pages.
      return await forwardJsonResponse(response);
    }

    const payload = (await response.json().catch(() => null)) as SearchResponse | null;
    if (!payload || !Array.isArray(payload.items)) {
      return NextResponse.json(payload ?? {}, { status: response.status });
    }

    const fakeProfiles = getMatchingFakeProfiles(
      params.get("country"),
      params.get("city"),
      params.get("gender"),
    );
    const insertAt = insertionIndexAfterOnlineBlock(payload.items);
    const augmented: SearchResponse = {
      ...payload,
      items: [
        ...payload.items.slice(0, insertAt),
        ...fakeProfiles,
        ...payload.items.slice(insertAt),
      ],
      count: payload.count + fakeProfiles.length,
    };
    return NextResponse.json(augmented, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach upstream search service." },
      { status: 502 },
    );
  }
}
