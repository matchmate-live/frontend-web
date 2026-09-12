import { NextRequest, NextResponse } from "next/server";

function env(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: NextRequest) {
  const apiBaseUrl = env("API_BASE_URL");
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

    const payload = await response.json();
    const out = NextResponse.json(payload, {
      status: response.status,
    });
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) {
      out.headers.set("Cache-Control", cacheControl);
    }
    return out;
  } catch {
    return NextResponse.json(
      { message: "Unable to reach upstream search service." },
      { status: 502 },
    );
  }
}
