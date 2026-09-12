import { throwApiError } from "@/lib/api/clientError";

export type SearchProfile = {
  userId: string;
  name?: string;
  description?: string;
  city?: string;
  country?: string;
  age?: number;
  gender?: string;
  photos?: string[];
  /** Epoch ms; used for status (online vs last seen). */
  lastSeen?: number;
  /** `country#city#gender` — search may return from GSI. */
  locationGender?: string;
  /** `country#gender` — search may return from GSI. */
  countryGender?: string;
};

export type SearchResponse = {
  items: SearchProfile[];
  count: number;
  limit: number;
  nextToken: string | null;
  lastSeenUpdated?: boolean;
  lastSeenAt?: number | null;
};

export type FilterState = {
  minAge: number;
  maxAge: number;
  country: string;
  city: string;
  gender: "male" | "female";
};

export const DEFAULT_MIN_AGE = 18;
export const DEFAULT_MAX_AGE = 40;
export const DEFAULT_ANON_GENDER = "female";
const LAST_SEEN_STORAGE_KEY = "matchmate.search.lastSeen";

function getStoredLastSeen(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LAST_SEEN_STORAGE_KEY);
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return String(Math.floor(n));
}

function setStoredLastSeen(value: number) {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(value) || value < 0) return;
  window.localStorage.setItem(LAST_SEEN_STORAGE_KEY, String(Math.floor(value)));
}

async function optionalSearchAuthHeaders(): Promise<{ headers: HeadersInit; isAuthenticated: boolean }> {
  try {
    const { fetchAuthSession } = await import("aws-amplify/auth");
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      return { headers: { Authorization: `Bearer ${token}` }, isAuthenticated: true };
    }
  } catch {
    // not signed in — anonymous search
  }
  return { headers: {}, isAuthenticated: false };
}

export async function fetchProfilesByLocation(filters: FilterState) {
  const auth = await optionalSearchAuthHeaders();
  const query = new URLSearchParams({
    country: filters.country,
    minAge: String(filters.minAge),
    maxAge: String(filters.maxAge),
    gender: filters.gender ?? DEFAULT_ANON_GENDER,
  });
  if (filters.city) query.set("city", filters.city);
  if (auth.isAuthenticated) {
    const lastSeen = getStoredLastSeen();
    if (lastSeen) query.set("lastSeen", lastSeen);
  }

  const response = await fetch(`/api/search?${query.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...auth.headers,
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Search request failed");
  }
  const out = (await response.json()) as SearchResponse;
  if (auth.isAuthenticated && out.lastSeenUpdated) {
    setStoredLastSeen(
      typeof out.lastSeenAt === "number" && Number.isFinite(out.lastSeenAt) ? out.lastSeenAt : Date.now(),
    );
  }
  return out;
}
