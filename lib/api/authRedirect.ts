import { ApiError } from "./clientError";

/**
 * True only if `err` actually triggered the session-expired toast (see
 * `sessionExpiredNotified` on `ApiError` / `notifyIfSessionExpired` in clientError.ts).
 * Deliberately NOT just `status === 401` — a 401 also happens for an anonymous visitor
 * hitting a route that requires auth, and that isn't an expiry, since they never had a
 * session to lose. Call sites use this to decide whether to skip their own inline error:
 * skip only when the toast really covered it, otherwise fall through to normal handling
 * (a 404 page, an inline message, etc.) — never silently show nothing.
 *
 * This app never auto-redirects on session expiry — no page should navigate a visitor
 * away from what they were doing just because a background request 401'd. The toast
 * itself (`lib/toast/ToastProvider.tsx`) carries an in-place "Sign in" link instead,
 * leaving the decision to actually leave the page up to the visitor.
 */
export function isSessionExpiredError(err: unknown): boolean {
  return err instanceof ApiError && err.sessionExpiredNotified;
}
