import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/api/serverEnv";
import { forwardJsonResponse } from "@/lib/api/proxy";

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

    return await forwardJsonResponse(response);
  } catch {
    return NextResponse.json(
      { message: "Unable to reach upstream search service." },
      { status: 502 },
    );
  }
}
