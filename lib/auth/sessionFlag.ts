const HAD_SESSION_KEY = "mm-had-session";

/**
 * Tracks, in localStorage, whether this browser has an actually-confirmed login session
 * right now — set by `AuthProvider` every time it resolves `isLoggedIn`, never guessed.
 * This is what the session-expired toast (`lib/api/clientError.ts`) gates on: a 401 only
 * means "your session expired" for someone who really had one. An anonymous visitor
 * hitting a 401 on a route that happens to require auth was never signed in to begin
 * with — that's not an expiry, so no toast fires for them, no matter how many 401s show
 * up. Survives page reloads by design (a real login session does too); wrapped in
 * try/catch since localStorage can throw in private-browsing contexts.
 */
export function markHadSession(hadSession: boolean): void {
  try {
    localStorage.setItem(HAD_SESSION_KEY, hadSession ? "true" : "false");
  } catch {
    // Unavailable — the toast simply won't fire, which is the safe default.
  }
}

export function hadSession(): boolean {
  try {
    return localStorage.getItem(HAD_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}
