import { hadSession, markHadSession } from "@/lib/auth/sessionFlag";

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
  /**
   * True only if this specific error actually triggered the session-expired toast.
   * NOT the same as `status === 401` — an anonymous visitor's 401 never does (see
   * `notifyIfSessionExpired` below). Call sites check this, not raw status, to decide
   * whether to suppress their own inline error: if it's false, nothing told the visitor
   * anything, and they need their normal error handling (or a 404 page, etc.), not silence.
   */
  sessionExpiredNotified: boolean;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.sessionExpiredNotified = false;
  }
}

type SessionExpiredListener = () => void;
let sessionExpiredListener: SessionExpiredListener | null = null;

/**
 * Registered exactly once, by `ToastProvider` on mount — not for general use elsewhere.
 * This is the single place that decides "show the session-expired toast": every 401
 * anywhere in the app funnels through `throwApiError` or `throwSessionExpiredError`
 * below, so there's exactly one trigger point instead of each call site re-implementing
 * "is this a real 401" and remembering to notify on it.
 */
export function setSessionExpiredListener(listener: SessionExpiredListener | null): void {
  sessionExpiredListener = listener;
}

/**
 * A 401 alone does not mean "your session expired" — an anonymous visitor hitting a
 * route that requires auth also gets a 401, and was never signed in to begin with. Only
 * notify when `hadSession()` says this browser actually had a confirmed login (set by
 * AuthProvider — see sessionFlag.ts), and consume it immediately so a burst of requests
 * failing together after the real expiry only shows the toast once, not once per request.
 */
function notifyIfSessionExpired(err: ApiError): void {
  if (err.status !== 401) return;
  if (!hadSession()) return;
  markHadSession(false);
  err.sessionExpiredNotified = true;
  sessionExpiredListener?.();
}

/** Reads the error message from a failed Response and throws an `ApiError`. 401s notify the session-expired listener. */
export async function throwApiError(res: Response, fallback?: string): Promise<never> {
  const err = new ApiError(res.status, await readApiErrorMessage(res, fallback));
  notifyIfSessionExpired(err);
  throw err;
}

/**
 * For call sites that determine "no session" locally (e.g. no token available at all)
 * rather than from an actual failed Response — still funnels through the same single
 * notification path as a real backend 401, so callers never call `showToast` themselves.
 */
export function throwSessionExpiredError(
  message = "Your session has expired. Please sign in again.",
): never {
  const err = new ApiError(401, message);
  notifyIfSessionExpired(err);
  throw err;
}
