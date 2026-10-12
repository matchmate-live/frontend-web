import { NextResponse } from "next/server";
import { serverEnv } from "./serverEnv";

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

/**
 * Headers that tell the backend the visitor's IP, for its per-IP rate limits. The backend sees
 * Vercel's IP, so the visitor's is passed along with the shared secret that lets the backend
 * trust it. Vercel sets x-real-ip / x-forwarded-for itself, so visitors can't fake them.
 * Empty when PROXY_SHARED_SECRET isn't set.
 */
export function clientIpHeaders(request: Request): Record<string, string> {
  const proxySecret = serverEnv("PROXY_SHARED_SECRET");
  const clientIp =
    request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return proxySecret && clientIp ? { "X-Proxy-Secret": proxySecret, "X-Client-Ip": clientIp } : {};
}

/**
 * True if the request came from a page on this site. Public POST routes have no sign-in token,
 * so without this any other website could make its visitors' browsers call them (CSRF).
 * - Content-Type must be JSON: a browser only sends that cross-site after asking permission
 *   (CORS preflight), which this site never grants. Plain-text or form posts are rejected.
 * - If the browser says where the request came from (Origin), it must be this site.
 */
function isSameSiteJsonRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return false;

  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin requests don't always send it; the JSON check covers them
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/**
 * Forwards a public (no sign-in) JSON POST to the backend at backendPath and passes the
 * response through. Only accepts requests from this site's own pages.
 */
export async function proxyPublicPost(request: Request, backendPath: string): Promise<NextResponse> {
  if (!isSameSiteJsonRequest(request)) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const apiBaseUrl = serverEnv("API_BASE_URL");
  if (!apiBaseUrl) {
    return NextResponse.json({ message: "Server is missing API_BASE_URL." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const response = await fetch(new URL(backendPath, apiBaseUrl).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...clientIpHeaders(request),
      },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    });
    return await forwardJsonResponse(response);
  } catch {
    return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 502 });
  }
}
