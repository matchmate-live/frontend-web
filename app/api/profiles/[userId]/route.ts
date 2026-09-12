import { NextRequest, NextResponse } from "next/server";
import { getSubFromBearerAuth } from "@/lib/api/jwtSub";
import { serverEnv } from "@/lib/api/serverEnv";

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
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const apiBaseUrl = serverEnv("API_BASE_URL");
  if (!apiBaseUrl) {
    return NextResponse.json({ message: "Server is missing API_BASE_URL." }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (!getSubFromBearerAuth(auth)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await context.params;
  if (!userId?.trim()) {
    return NextResponse.json({ message: "userId is required" }, { status: 400 });
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
    const payload = await response.json().catch(() => ({}));
    const out = NextResponse.json(payload, { status: response.status });
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) {
      out.headers.set("Cache-Control", cacheControl);
    }
    return out;
  } catch {
    return NextResponse.json({ message: "Unable to reach profile service." }, { status: 502 });
  }
}
