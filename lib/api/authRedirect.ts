import type { useRouter } from "next/navigation";
import { ApiError } from "./clientError";

/**
 * True if `err` means the session is gone — expired, refresh failed, or the backend
 * rejected the token (401). There's no useful in-place recovery from this; the only
 * real action is signing in again.
 */
export function isSessionExpiredError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

/**
 * If `err` indicates the session is gone, redirects to sign-in with the current path
 * preserved (`next`) and a `reason` the sign-in page uses to show an accurate subtitle
 * instead of a raw/generic error in place. Returns true when it redirected, so the
 * caller can skip setting its own inline error message in that case.
 *
 * `reason` defaults to "expired" ("Your session has expired") — accurate for pages that
 * already gate on being signed in before rendering (onboarding steps, the email
 * verification banner), where a 401 during an action can only mean a session that
 * *was* valid just lapsed. Pass `"required"` ("Please sign in to continue") for pages
 * anonymous visitors can reach directly (e.g. viewing someone's profile), where "Not
 * signed in" more often means they were never signed in at all, not that anything expired.
 */
export function redirectIfSessionExpired(
  err: unknown,
  router: ReturnType<typeof useRouter>,
  pathname: string,
  reason: "expired" | "required" = "expired",
): boolean {
  if (!isSessionExpiredError(err)) return false;
  router.replace(`/auth/sign-in?next=${encodeURIComponent(pathname)}&reason=${reason}`);
  return true;
}
