import { NextResponse } from "next/server";

/**
 * Forwards a backend fetch `Response` as a Next.js Route Handler response: same
 * status code, same JSON body, and Cache-Control passed through when present.
 *
 * The backend always replies with `{ message }` on error and never leaks internal
 * detail on 5xx (see backend/src/utils/http.js `createErrorResponse`), so it's safe
 * to relay the parsed body directly. `.json()` is guarded because a broken upstream
 * (e.g. a raw API Gateway 502/504 HTML page) won't be valid JSON.
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
