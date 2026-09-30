import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/api/serverEnv";
import { forwardJsonResponse } from "@/lib/api/proxy";
import { getFakeProfileById } from "@/lib/fakeProfiles";

export const runtime = "nodejs";

function upstreamHeaders(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth) {
    headers.Authorization = auth;
  }
  return headers;
}

/**
 * GET profile by id (same upstream as /profiles/me, path is explicit member id).
 * Used when opening /profile/[userId] from search; forwards Cache-Control for browser caching.
 * Public: the backend route itself has no authorizer and resolves an optional viewer
 * identity, same as /search — an anonymous visitor gets the redacted public view, not 401.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  if (!userId?.trim()) {
    return NextResponse.json({ message: "userId is required" }, { status: 400 });
  }

  // Fake (filler) profiles are answered from the local JSON — no backend round trip. Not
  // cached: lastSeen is stamped "now" on every read, like the search results they come from.
  const fake = getFakeProfileById(userId.trim());
  if (fake) {
    return NextResponse.json(fake, { headers: { "Cache-Control": "no-store" } });
  }

  const apiBaseUrl = serverEnv("API_BASE_URL");
  if (!apiBaseUrl) {
    return NextResponse.json({ message: "Server is missing API_BASE_URL." }, { status: 500 });
  }

  try {
    const response = await fetch(
      new URL(`/profiles/${encodeURIComponent(userId.trim())}`, apiBaseUrl).toString(),
      {
        method: "GET",
        headers: upstreamHeaders(request),
        cache: "no-store",
      },
    );
    return await forwardJsonResponse(response);
  } catch {
    return NextResponse.json({ message: "Unable to reach profile service." }, { status: 502 });
  }
}
