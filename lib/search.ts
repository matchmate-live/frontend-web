export type SearchProfile = {
  userId: string;
  name?: string;
  description?: string;
  city?: string;
  country?: string;
  age?: number;
  gender?: string;
  photos?: string[];
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

export async function fetchProfilesByLocation(filters: FilterState) {
  const query = new URLSearchParams({
    country: filters.country,
    minAge: String(filters.minAge),
    maxAge: String(filters.maxAge),
    gender: filters.gender ?? DEFAULT_ANON_GENDER,
  });
  if (filters.city) query.set("city", filters.city);

  const response = await fetch(`/api/search?${query.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = (await response.json()) as SearchResponse | { message?: string };
  if (!response.ok) {
    throw new Error(
      "message" in payload && payload.message ? payload.message : "Search request failed",
    );
  }
  return payload as SearchResponse;
}
