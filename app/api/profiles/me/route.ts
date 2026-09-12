import { NextRequest, NextResponse } from "next/server";
import { getSubFromBearerAuth } from "@/lib/api/jwtSub";
import { serverEnv } from "@/lib/api/serverEnv";
import { forwardJsonResponse } from "@/lib/api/proxy";

export const runtime = "nodejs";

function upstreamHeaders(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth) {
    headers.Authorization = auth;
  }
  return headers;
}

export async function GET(request: NextRequest) {
  const apiBaseUrl = serverEnv("API_BASE_URL");
  if (!apiBaseUrl) {
    return NextResponse.json({ message: "Server is missing API_BASE_URL." }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  const sub = getSubFromBearerAuth(auth);
  if (!sub) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(new URL(`/profiles/${encodeURIComponent(sub)}`, apiBaseUrl).toString(), {
      method: "GET",
      headers: upstreamHeaders(request),
      cache: "no-store",
    });
    return await forwardJsonResponse(response);
  } catch {
    return NextResponse.json({ message: "Unable to reach profile service." }, { status: 502 });
  }
}

export async function PUT(request: NextRequest) {
  const apiBaseUrl = serverEnv("API_BASE_URL");
  if (!apiBaseUrl) {
    return NextResponse.json({ message: "Server is missing API_BASE_URL." }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  const sub = getSubFromBearerAuth(auth);
  if (!sub) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const response = await fetch(new URL(`/profiles/${encodeURIComponent(sub)}`, apiBaseUrl).toString(), {
      method: "PUT",
      headers: {
        ...upstreamHeaders(request),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return await forwardJsonResponse(response);
  } catch {
    return NextResponse.json({ message: "Unable to reach profile service." }, { status: 502 });
  }
}
