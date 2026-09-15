const HAD_SESSION_KEY = "mm-had-session";

/**
 * Tracks, in localStorage, whether this browser has a confirmed login right now — set by
 * `AuthProvider` whenever it resolves `isLoggedIn`, never guessed. This is what the
 * session-expired toast gates on: an anonymous visitor's 401 was never a real session, so
 * no toast fires for them. Survives reloads by design; try/catch for private browsing.
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
