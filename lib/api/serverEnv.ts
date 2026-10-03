// Server-only env reads. process.env[name] works on the server, but not for
// NEXT_PUBLIC_* values in browser code.
export function serverEnv(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}
