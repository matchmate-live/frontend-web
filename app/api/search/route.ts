import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/api/serverEnv";
import { forwardJsonResponse } from "@/lib/api/proxy";
import { getMatchingFakeProfiles } from "@/lib/fakeProfiles";
import type { SearchProfile, SearchResponse } from "@/lib/search";

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

/**
 * Shared cache at Vercel's CDN: identical searches (same filters → same URL) within 5 minutes
 * are served from the CDN without invoking this function or AWS; for 5 minutes after that a
 * stale copy is served while one request refreshes it in the background. s-maxage applies to
 * the CDN only — browsers don't cache it. Trade-off: results/online status up to ~10 min old.
 */
const SHARED_SEARCH_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=300";

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

  try {
    // No Authorization forwarded: search is viewer-independent (the web app always sends
    // gender), which is what makes the shared CDN caching below safe.
    const response = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const out = await forwardJsonResponse(response);
      out.headers.set("Cache-Control", "no-store");
      return out;
    }

    if (params.get("nextToken")) {
      // Fake profiles are only spliced into the first page — never appended past it,
      // which would duplicate them across "load more" pages.
      const out = await forwardJsonResponse(response);
      out.headers.set("Cache-Control", SHARED_SEARCH_CACHE_CONTROL);
      return out;
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
    return NextResponse.json(augmented, {
      status: response.status,
      headers: { "Cache-Control": SHARED_SEARCH_CACHE_CONTROL },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach upstream search service." },
      { status: 502 },
    );
  }
}
