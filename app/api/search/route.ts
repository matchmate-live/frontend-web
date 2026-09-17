import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/api/serverEnv";
import { forwardJsonResponse } from "@/lib/api/proxy";
import { getMatchingFakeProfiles } from "@/lib/fakeProfiles";
import type { SearchResponse } from "@/lib/search";

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
    const augmented: SearchResponse = {
      ...payload,
      items: [...payload.items, ...fakeProfiles],
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
