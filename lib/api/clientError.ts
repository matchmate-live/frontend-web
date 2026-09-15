import { hadSession, markHadSession } from "@/lib/auth/sessionFlag";

type ApiErrorBody = { message?: string };

/**
 * Extracts a user-safe message from a failed fetch `Response`. Every route replies with
 * `{ message }` and never leaks internals on 5xx (backend `createErrorResponse`, relayed
 * as-is by proxy.ts) — this just survives a non-JSON body and fills in a default.
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
   * True only if this error actually triggered the session-expired toast — not the same
   * as `status === 401` (an anonymous visitor's 401 never does; see
   * `notifyIfSessionExpired`). Call sites check this, not raw status, before suppressing
   * their own inline error.
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
 * Registered once, by `ToastProvider` on mount. Every 401 app-wide funnels through
 * `throwApiError`/`throwSessionExpiredError` below — one trigger point, not each call
 * site reimplementing "is this a real 401".
 */
export function setSessionExpiredListener(listener: SessionExpiredListener | null): void {
  sessionExpiredListener = listener;
}

/**
 * A 401 alone doesn't mean "session expired" — an anonymous visitor hitting an
 * auth-required route also gets one. Only notify when `hadSession()` confirms a real
 * prior login, and consume it immediately so a burst of failing requests toasts once.
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

/** For call sites that detect "no session" locally (no token at all), not from a failed
 * Response — still funnels through the same notification path as a real 401. */
export function throwSessionExpiredError(
  message = "Your session has expired. Please sign in again.",
): never {
  const err = new ApiError(401, message);
  notifyIfSessionExpired(err);
  throw err;
}
