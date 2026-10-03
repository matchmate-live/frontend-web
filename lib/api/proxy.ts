import { NextResponse } from "next/server";

/**
 * Passes a backend response through as-is: status, JSON body and Cache-Control.
 * Safe because backend errors never contain internals. The JSON parse is guarded since an
 * API Gateway 502/504 page isn't JSON.
 */
export async function forwardJsonResponse(response: Response): Promise<NextResponse> {
  const payload = await response.json().catch(() => ({}));
  const out = NextResponse.json(payload, { status: response.status });
  const cacheControl = response.headers.get("cache-control");
  if (cacheControl) {
    out.headers.set("Cache-Control", cacheControl);
  }
  return out;
}
