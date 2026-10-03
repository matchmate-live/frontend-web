/**
 * "I'm active" ping that keeps a signed-in user showing as online (15-minute window).
 * Called on user actions, but only sends every 14 minutes. The last send time is kept in
 * localStorage so it's shared across tabs and reloads.
 */
export const PRESENCE_REFRESH_MS = 14 * 60 * 1000;
const LAST_SENT_STORAGE_KEY = "matchmate.presence.lastSentAt";

// Fallback when localStorage is blocked, so we don't ping on every click. Lost on reload.
let lastSentInMemory: number | null = null;

function readLastSent(): number | null {
  try {
    const raw = window.localStorage.getItem(LAST_SENT_STORAGE_KEY);
    if (raw != null) {
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
  } catch {
    // storage blocked, use the in-memory copy
  }
  return lastSentInMemory;
}

function writeLastSent(value: number | null) {
  lastSentInMemory = value;
  try {
    if (value == null) window.localStorage.removeItem(LAST_SENT_STORAGE_KEY);
    else window.localStorage.setItem(LAST_SENT_STORAGE_KEY, String(value));
  } catch {
    // storage blocked, the in-memory copy still works for this page
  }
}

// Called on sign-in/out so the new account pings right away.
export function resetPresence(): void {
  writeLastSent(null);
}

// Token if signed in, else null. Unlike authHeader(), never shows the session-expired toast.
async function quietIdToken(): Promise<string | null> {
  try {
    const { fetchAuthSession } = await import("aws-amplify/auth");
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

// After a failure, wait a minute before retrying so an outage doesn't mean a request per click.
const RETRY_AFTER_FAILURE_MS = 60 * 1000;

function retryLater(attemptedAt: number): number {
  return attemptedAt - PRESENCE_REFRESH_MS + RETRY_AFTER_FAILURE_MS;
}

let inFlight = false;

export async function touchPresence(): Promise<void> {
  if (typeof window === "undefined" || inFlight) return;
  const previous = readLastSent();
  const now = Date.now();
  if (previous != null && now - previous < PRESENCE_REFRESH_MS) return;

  inFlight = true;
  // Take a 1-minute lock first so other clicks and tabs don't send too. The full 14 minutes
  // is only set on success, so a reload mid-request just retries after a minute.
  writeLastSent(retryLater(now));
  try {
    const token = await quietIdToken();
    if (!token) {
      writeLastSent(previous); // not signed in, nothing was sent
      return;
    }
    const res = await fetch("/api/presence", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      keepalive: true,
    });
    // Success starts the 14-minute wait; on failure the 1-minute lock stays.
    if (res.ok) writeLastSent(now);
  } catch {
    // network error, the 1-minute lock stays
  } finally {
    inFlight = false;
  }
}
