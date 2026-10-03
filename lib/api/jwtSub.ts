import { Buffer } from "node:buffer";

// Reads the user id from an ID token. The backend still verifies it.
export function getSubFromBearerAuth(authorization: string | null): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7);
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as { sub?: string };
    return typeof payload.sub === "string" && payload.sub.trim() ? payload.sub.trim() : null;
  } catch {
    return null;
  }
}
