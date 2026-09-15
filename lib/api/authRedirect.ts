import { ApiError } from "./clientError";

/**
 * True only if `err` actually triggered the session-expired toast (see
 * `sessionExpiredNotified` in clientError.ts) — not just `status === 401`, since an
 * anonymous visitor hitting an auth-required route also gets a 401 without ever having had
 * a session. Call sites use this to skip their own inline error only when the toast really
 * covered it, never to silently show nothing. Session expiry never auto-redirects here —
 * the toast carries an in-place "Sign in" link instead.
 */
export function isSessionExpiredError(err: unknown): boolean {
  return err instanceof ApiError && err.sessionExpiredNotified;
}
