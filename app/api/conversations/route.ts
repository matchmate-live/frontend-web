import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/api/serverEnv";
import { forwardJsonResponse } from "@/lib/api/proxy";

export const runtime = "nodejs";

/** Requires a real bearer token — unlike profile viewing, your conversation list is never public. */
export async function GET(request: NextRequest) {
  const apiBaseUrl = serverEnv("API_BASE_URL");
  if (!apiBaseUrl) {
    return NextResponse.json({ message: "Server is missing API_BASE_URL." }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const nextToken = request.nextUrl.searchParams.get("nextToken");
  const upstreamUrl = new URL("/conversations", apiBaseUrl);
  if (nextToken) upstreamUrl.searchParams.set("nextToken", nextToken);

  try {
    const response = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json", Authorization: auth },
      cache: "no-store",
    });
    return await forwardJsonResponse(response);
  } catch {
    return NextResponse.json({ message: "Unable to reach messaging service." }, { status: 502 });
  }
}
