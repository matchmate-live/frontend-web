import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/api/serverEnv";
import { forwardJsonResponse } from "@/lib/api/proxy";

export const runtime = "nodejs";

/** Requires a real bearer token; the backend also checks the caller is actually a participant. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  const apiBaseUrl = serverEnv("API_BASE_URL");
  if (!apiBaseUrl) {
    return NextResponse.json({ message: "Server is missing API_BASE_URL." }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await context.params;
  if (!conversationId?.trim()) {
    return NextResponse.json({ message: "conversationId is required" }, { status: 400 });
  }

  const nextToken = request.nextUrl.searchParams.get("nextToken");
  const limit = request.nextUrl.searchParams.get("limit");
  const upstreamUrl = new URL(`/messages/${encodeURIComponent(conversationId.trim())}`, apiBaseUrl);
  if (nextToken) upstreamUrl.searchParams.set("nextToken", nextToken);
  if (limit) upstreamUrl.searchParams.set("limit", limit);

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
