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

// Real online users, then fakes, then real offline users — fakes shouldn't outrank someone
// actually online, but should outrank anyone who isn't, no matter how recently they were.
function partitionByOnlineStatus(
  items: SearchProfile[],
): { online: SearchProfile[]; offline: SearchProfile[] } {
  const online: SearchProfile[] = [];
  const offline: SearchProfile[] = [];
  for (const item of items) {
    (isOnlineNow(item) ? online : offline).push(item);
  }
  return { online, offline };
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
    const { online, offline } = partitionByOnlineStatus(payload.items);
    const augmented: SearchResponse = {
      ...payload,
      items: [...online, ...fakeProfiles, ...offline],
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
