type ApiErrorBody = { message?: string };

/**
 * Extracts a user-safe message from a failed fetch `Response`. Every MatchMate
 * API route / backend endpoint replies with `{ message }` on error and never
 * leaks internal detail on 5xx (backend/src/utils/http.js `createErrorResponse`,
 * relayed as-is by lib/api/proxy.ts `forwardJsonResponse`) — this just needs to
 * survive a non-JSON body (e.g. a raw gateway error page) and fill in a sane
 * default when the field is missing.
 */
export async function readApiErrorMessage(
  res: Response,
  fallback: string = `Request failed (${res.status})`,
): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as ApiErrorBody;
  return typeof data.message === "string" && data.message ? data.message : fallback;
}

/** Thrown by API client helpers on a non-ok response; carries the HTTP status alongside the message. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Reads the error message from a failed Response and throws an `ApiError`. */
export async function throwApiError(res: Response, fallback?: string): Promise<never> {
  throw new ApiError(res.status, await readApiErrorMessage(res, fallback));
}
