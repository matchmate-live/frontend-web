const HAD_SESSION_KEY = "mm-had-session";

// Remembers in localStorage whether this browser is signed in (set by AuthProvider).
// The session-expired toast only shows if it was, so signed-out visitors never see it.
export function markHadSession(hadSession: boolean): void {
  try {
    localStorage.setItem(HAD_SESSION_KEY, hadSession ? "true" : "false");
  } catch {
    // Storage unavailable, so the toast just won't show.
  }
}

export function hadSession(): boolean {
  try {
    return localStorage.getItem(HAD_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}
