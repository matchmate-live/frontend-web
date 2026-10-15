// Runs per request: the answer depends on who's asking.
export const dynamic = "force-dynamic";

// The visitor's country from Vercel's IP geolocation, e.g. {"country":"PK"}, or null when
// unknown (always the case locally, where Vercel adds no header). Browsers call this once and
// keep the answer (lib/geoData.ts), so it's never cached here, and never by the CDN, which
// would hand one visitor's country to everyone.
export function GET(request: Request) {
  const header = request.headers.get("x-vercel-ip-country")?.trim().toUpperCase() ?? "";
  const country = /^[A-Z]{2}$/.test(header) ? header : null;
  return Response.json({ country }, { headers: { "Cache-Control": "private, no-store" } });
}
