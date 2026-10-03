import type { ProfileResponse } from "./types";

const CACHE_KEY = "matchmate.myProfile.cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes; your own edits update it right away

type CachedEntry = { profile: ProfileResponse; at: number };

let memoryCache: CachedEntry | null = null;

function readLocalStorageCache(): CachedEntry | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedEntry>;
    if (!parsed || typeof parsed.at !== "number" || !parsed.profile) return null;
    return parsed as CachedEntry;
  } catch {
    return null;
  }
}

// Call with the result of any profile write so the change shows everywhere right away.
export function setMyProfileCache(profile: ProfileResponse): void {
  const entry: CachedEntry = { profile, at: Date.now() };
  memoryCache = entry;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* storage unavailable, the memory cache still works for this tab */
  }
}

// Clears the cache so the next read fetches fresh.
export function clearMyProfileCache(): void {
  memoryCache = null;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* best effort */
  }
}

/**
 * The cached profile if it's still fresh, otherwise null. Pass forUserId so you never get
 * another account's profile after switching users.
 */
export function getCachedProfileIfFresh(forUserId?: string): ProfileResponse | null {
  const cached = memoryCache ?? readLocalStorageCache();
  if (!cached || Date.now() - cached.at >= CACHE_TTL_MS) return null;
  if (forUserId !== undefined && cached.profile.userId !== forUserId) return null;
  memoryCache = cached;
  return cached.profile;
}
