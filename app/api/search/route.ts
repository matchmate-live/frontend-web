import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/api/serverEnv";
import { forwardJsonResponse } from "@/lib/api/proxy";
import { getMatchingFakeProfiles } from "@/lib/fakeProfiles";
import type { SearchProfile, SearchResponse } from "@/lib/search";

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

// Vercel's CDN caches each search for 5 minutes, then serves it stale for 5 more while it
// refreshes. Browsers don't cache it. Results can be up to ~10 minutes old.
const SHARED_SEARCH_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=300";

function isOnlineNow(profile: SearchProfile): boolean {
  return (
    typeof profile.lastSeen === "number" &&
    Number.isFinite(profile.lastSeen) &&
    Date.now() - profile.lastSeen < ONLINE_WINDOW_MS
  );
}

// Order: real users who are online, then fake profiles, then everyone else.
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
    // No auth header: results don't depend on who's asking, so they can be cached for everyone.
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
      // Fake profiles only go on the first page, otherwise they'd repeat on "load more".
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
