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
  emailVerified?: boolean;
  /** Epoch ms; used for status (online vs last seen). */
  lastSeen?: number;
  /** Who they're looking for — shown on the card; either age bound may be absent. */
  genderPreference?: string;
  seekingAgeMin?: number;
  seekingAgeMax?: number;
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
export async function fetchProfilesByLocation(
  filters: FilterState,
  options?: { signal?: AbortSignal; nextToken?: string | null },
) {
  const query = new URLSearchParams({
    country: filters.country,
    minAge: String(filters.minAge),
    maxAge: String(filters.maxAge),
    gender: filters.gender ?? DEFAULT_ANON_GENDER,
  });
  if (filters.city) query.set("city", filters.city);
  if (options?.nextToken) query.set("nextToken", options.nextToken);

  const response = await fetch(`/api/search?${query.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: options?.signal,
  });

  if (!response.ok) {
    await throwApiError(response, "Search request failed");
  }
  return (await response.json()) as SearchResponse;
}
