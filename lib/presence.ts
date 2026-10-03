/**
 * "I'm active" ping that keeps the signed-in user's lastSeen fresh (what shows them as
 * "Online now" — a 15-minute window). Called on user actions (PresenceTracker), but only
 * actually sends if PRESENCE_REFRESH_MS has passed since the last send — tracked in
 * localStorage, so it's shared across tabs and survives reloads. One minute under the online
 * window, so an active user's status never lapses between pings.
 */
export const PRESENCE_REFRESH_MS = 14 * 60 * 1000;
const LAST_SENT_STORAGE_KEY = "matchmate.presence.lastSentAt";

/** In-memory copy, used when localStorage is blocked (some privacy modes): without it every
 * action would read "never sent" and ping. Only covers the current page — across reloads in
 * such a browser it's at most one ping per load. */
let lastSentInMemory: number | null = null;

function readLastSent(): number | null {
  try {
    const raw = window.localStorage.getItem(LAST_SENT_STORAGE_KEY);
    if (raw != null) {
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
  } catch {
    // storage unavailable — fall through to the in-memory copy
  }
  return lastSentInMemory;
}

function writeLastSent(value: number | null) {
  lastSentInMemory = value;
  try {
    if (value == null) window.localStorage.removeItem(LAST_SENT_STORAGE_KEY);
    else window.localStorage.setItem(LAST_SENT_STORAGE_KEY, String(value));
  } catch {
    // storage unavailable — the in-memory copy above still throttles this page
  }
}

/** Forget the last-sent time — on sign-in/out, so a newly signed-in account pings straight
 * away instead of inheriting the previous account's 14-minute wait. */
export function resetPresence(): void {
  writeLastSent(null);
}

/** Bearer token if signed in, else null — quietly, unlike authHeader(), which would surface
 * a "session expired" notice for what is just a background ping. */
async function quietIdToken(): Promise<string | null> {
  try {
    const { fetchAuthSession } = await import("aws-amplify/auth");
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

/** After a failed send, allow a retry in 1 minute rather than on the very next click — so an
 * outage doesn't turn every tap into a request. */
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
  // Claimed before the request, so other actions/tabs firing meanwhile don't double-send —
  // but only as a 1-minute lock. The full 14-minute wait is written only once the request
  // is known to have succeeded, so if the page is reloaded/closed mid-request (outcome
  // never seen), the worst case is a retry after a minute, not 14 minutes offline.
  writeLastSent(retryLater(now));
  try {
    const token = await quietIdToken();
    if (!token) {
      writeLastSent(previous); // not signed in — nothing sent, so don't start any wait
      return;
    }
    const res = await fetch("/api/presence", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      keepalive: true,
    });
    // Success → full 14-minute wait. Failure → leave the 1-minute retry lock in place.
    if (res.ok) writeLastSent(now);
  } catch {
    // network error — the 1-minute retry lock written above stays
  } finally {
    inFlight = false;
  }
}
