import type { ProfileResponse } from "./types";

const CACHE_KEY = "matchmate.myProfile.cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — own-account edits bypass this entirely (see setMyProfileCache)

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

/**
 * Seeds the cache with a known-fresh profile — call this with the result of any write
 * (updateMyProfile, email verification, etc.) so the change is reflected everywhere that
 * reads fetchMyProfileCached() immediately, without waiting out the TTL or spending an
 * extra request to re-fetch what was just returned anyway.
 */
export function setMyProfileCache(profile: ProfileResponse): void {
  const entry: CachedEntry = { profile, at: Date.now() };
  memoryCache = entry;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* private browsing / storage disabled — memory cache still covers this tab */
  }
}

/** Forces the next fetchMyProfileCached() call to hit the network, discarding any cached value. */
export function clearMyProfileCache(): void {
  memoryCache = null;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* best effort */
  }
}

/** The cached profile, if one exists and is still within the TTL — null otherwise (no fetch). */
export function getCachedProfileIfFresh(): ProfileResponse | null {
  const cached = memoryCache ?? readLocalStorageCache();
  if (!cached || Date.now() - cached.at >= CACHE_TTL_MS) return null;
  memoryCache = cached;
  return cached.profile;
}
