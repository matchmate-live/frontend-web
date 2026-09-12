/**
 * Server-only (Route Handlers, server components). Dynamic `process.env[name]` is fine here —
 * Node sees the full env loaded from `.env.local`. Do not use this pattern for `NEXT_PUBLIC_*`
 * in code that runs in the browser; use `process.env.NEXT_PUBLIC_*` literals instead.
 */
export function serverEnv(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}
