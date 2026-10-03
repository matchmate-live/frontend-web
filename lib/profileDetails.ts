import type { ProfileResponse } from "@/lib/onboarding";

/**
 * Optional "about me" fields. Values must match the backend's lists
 * (backend/src/utils/profileDetails.js). Labels can be reworded freely; values can't.
 */
type Option = { value: string; label: string };

export const LIKE_OPTIONS: Option[] = [
  { value: "travel", label: "Travel" },
  { value: "music", label: "Music" },
  { value: "movies", label: "Movies" },
  { value: "reading", label: "Reading" },
  { value: "cooking", label: "Cooking" },
  { value: "fitness", label: "Fitness" },
  { value: "hiking", label: "Hiking" },
  { value: "photography", label: "Photography" },
  { value: "art", label: "Art" },
  { value: "dancing", label: "Dancing" },
  { value: "gaming", label: "Gaming" },
  { value: "sports", label: "Sports" },
  { value: "yoga", label: "Yoga" },
  { value: "fashion", label: "Fashion" },
  { value: "pets", label: "Pets" },
  { value: "food", label: "Food" },
  { value: "coffee", label: "Coffee" },
  { value: "nature", label: "Nature" },
  { value: "writing", label: "Writing" },
  { value: "volunteering", label: "Volunteering" },
  { value: "technology", label: "Technology" },
  { value: "cars", label: "Cars" },
  { value: "beach", label: "Beach" },
  { value: "camping", label: "Camping" },
  { value: "shopping", label: "Shopping" },
  { value: "gardening", label: "Gardening" },
];
export const MAX_LIKES = 5;

export const ETHNICITY_OPTIONS: Option[] = [
  { value: "east_asian", label: "East Asian" },
  { value: "south_asian", label: "South Asian" },
  { value: "southeast_asian", label: "Southeast Asian" },
  { value: "central_asian", label: "Central Asian" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "north_african", label: "North African" },
  { value: "sub_saharan_african", label: "Sub-Saharan African" },
  { value: "caribbean", label: "Caribbean" },
  { value: "hispanic_latino", label: "Hispanic / Latino" },
  { value: "european", label: "European" },
  { value: "north_american", label: "North American" },
  { value: "pacific_islander", label: "Pacific Islander" },
  { value: "indigenous", label: "Indigenous" },
  { value: "mixed", label: "Mixed" },
  { value: "other", label: "Other" },
];

export const RACE_OPTIONS: Option[] = [
  { value: "asian", label: "Asian" },
  { value: "black", label: "Black / African descent" },
  { value: "white", label: "White / Caucasian" },
  { value: "middle_eastern", label: "Middle Eastern / Arab" },
  { value: "indigenous", label: "Indigenous" },
  { value: "pacific_islander", label: "Pacific Islander" },
  { value: "mixed", label: "Mixed race" },
  { value: "other", label: "Other" },
];

export const BODY_TYPE_OPTIONS: Option[] = [
  { value: "petite", label: "Petite" },
  { value: "slim", label: "Slim" },
  { value: "athletic", label: "Athletic" },
  { value: "average", label: "Average" },
  { value: "curvy", label: "Curvy" },
  { value: "muscular", label: "Muscular" },
  { value: "stocky", label: "Stocky" },
  { value: "full_figured", label: "Full-figured" },
];

export const MIN_HEIGHT_CM = 100;
export const MAX_HEIGHT_CM = 250;
// Same limits as profile ages on the backend.
export const MIN_SEEKING_AGE = 18;
export const MAX_SEEKING_AGE = 100;

// Form state. Numbers are strings so inputs can be empty while typing.
export type ProfileDetailsForm = {
  likes: string[];
  ethnicity: string;
  race: string;
  bodyType: string;
  heightCm: string;
  seekingAgeMin: string;
  seekingAgeMax: string;
};

export type ProfileDetailsErrors = Partial<Record<"heightCm" | "seekingAge", string>>;

export function optionLabel(options: Option[], value: string | undefined): string | undefined {
  return value ? options.find((o) => o.value === value)?.label : undefined;
}

export function profileDetailsFromProfile(p: ProfileResponse | null | undefined): ProfileDetailsForm {
  return {
    likes: p?.likes ?? [],
    ethnicity: p?.ethnicity ?? "",
    race: p?.race ?? "",
    bodyType: p?.bodyType ?? "",
    heightCm: p?.heightCm != null ? String(p.heightCm) : "",
    seekingAgeMin: p?.seekingAgeMin != null ? String(p.seekingAgeMin) : "",
    seekingAgeMax: p?.seekingAgeMax != null ? String(p.seekingAgeMax) : "",
  };
}

function toIntOrNull(s: string): number | null {
  const t = s.trim();
  return t ? Number(t) : null;
}

// Request body. Every field is sent; null clears it.
export function profileDetailsToPayload(d: ProfileDetailsForm) {
  return {
    likes: d.likes,
    ethnicity: d.ethnicity || null,
    race: d.race || null,
    bodyType: d.bodyType || null,
    heightCm: toIntOrNull(d.heightCm),
    seekingAgeMin: toIntOrNull(d.seekingAgeMin),
    seekingAgeMax: toIntOrNull(d.seekingAgeMax),
  };
}

function isIntInRange(s: string, min: number, max: number): boolean {
  const n = Number(s.trim());
  return Number.isInteger(n) && n >= min && n <= max;
}

// Same rules as the backend, so errors show right away.
export function validateProfileDetails(d: ProfileDetailsForm): ProfileDetailsErrors {
  const errors: ProfileDetailsErrors = {};
  if (d.heightCm.trim() && !isIntInRange(d.heightCm, MIN_HEIGHT_CM, MAX_HEIGHT_CM)) {
    errors.heightCm = `Enter your height in cm as a whole number (${MIN_HEIGHT_CM}–${MAX_HEIGHT_CM}).`;
  }
  const min = d.seekingAgeMin.trim();
  const max = d.seekingAgeMax.trim();
  const ageRangeText = `${MIN_SEEKING_AGE}–${MAX_SEEKING_AGE}`;
  if (
    (min && !isIntInRange(min, MIN_SEEKING_AGE, MAX_SEEKING_AGE)) ||
    (max && !isIntInRange(max, MIN_SEEKING_AGE, MAX_SEEKING_AGE))
  ) {
    errors.seekingAge = `Ages need to be between ${ageRangeText}.`;
  } else if (min && max && Number(min) > Number(max)) {
    errors.seekingAge = "The \"From\" age can't be higher than the \"To\" age.";
  }
  return errors;
}

// "25–35", "25+" or "18–35", or undefined if neither end is set.
export function formatSeekingAgeRange(min?: number, max?: number): string | undefined {
  if (min != null && max != null) return min === max ? `${min}` : `${min}–${max}`;
  if (min != null) return `${min}+`;
  if (max != null) return `${MIN_SEEKING_AGE}–${max}`;
  return undefined;
}

// e.g. "Looking for men aged 25 to 35", "... aged 30+", or just "Looking for women".
export function formatLookingFor(genderPreference?: string, min?: number, max?: number): string | undefined {
  const who = genderPreference === "male" ? "men" : genderPreference === "female" ? "women" : undefined;
  if (!who) return undefined;
  if (min != null && max != null) {
    return min === max ? `Looking for ${who} aged ${min}` : `Looking for ${who} aged ${min} to ${max}`;
  }
  if (min != null) return `Looking for ${who} aged ${min}+`;
  if (max != null) return `Looking for ${who} aged ${MIN_SEEKING_AGE} to ${max}`;
  return `Looking for ${who}`;
}

// e.g. "170 cm (5′7″)"
export function formatHeight(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  return `${cm} cm (${Math.floor(totalInches / 12)}′${totalInches % 12}″)`;
}
