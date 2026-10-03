import type { SearchProfile } from "@/lib/search";
import type { ProfileResponse } from "@/lib/onboarding/types";
import { ageFromIsoDobUtc } from "@/lib/onboarding/validation";
import fakeProfilesDataDev from "./data.dev.json";
import fakeProfilesDataProd from "./data.prod.json";

// Stores dob, not age, so ages stay correct over time. About-me fields pass through as-is.
type FakeProfileTemplate = Omit<SearchProfile, "lastSeen" | "age"> &
  Pick<ProfileResponse, "likes" | "ethnicity" | "race" | "bodyType" | "heightCm"> & { dob: string };
type CountryEntry = { male: FakeProfileTemplate[]; female: FakeProfileTemplate[] };

// Dev file under `next dev`, prod file for any build. They can differ, e.g. to try new bios
// in dev first.
const DATA = (
  process.env.NODE_ENV === "production" ? fakeProfilesDataProd : fakeProfilesDataDev
) as Record<string, CountryEntry>;

/**
 * Filler profiles shown alongside real search results, always marked online.
 * Picks the country's profiles of the requested gender. With a city, returns only that
 * city's profiles if there are any, otherwise all of them.
 */
export function getMatchingFakeProfiles(
  country: string | null | undefined,
  city: string | null | undefined,
  gender: string | null | undefined,
): SearchProfile[] {
  const normalizedCountry = country?.trim().toLowerCase();
  if (!normalizedCountry) return [];
  const normalizedGender = gender?.trim().toLowerCase();
  if (normalizedGender !== "male" && normalizedGender !== "female") return [];

  const entry = DATA[normalizedCountry];
  if (!entry) return [];
  const genderProfiles = entry[normalizedGender];
  if (!genderProfiles?.length) return [];

  const normalizedCity = city?.trim().toLowerCase();
  const selected = normalizedCity
    ? genderProfiles.filter((profile) => profile.city === normalizedCity)
    : [];
  const result = selected.length > 0 ? selected : genderProfiles;

  return result.map(({ dob, ...profile }) => ({
    ...profile,
    ...liveFields(dob, normalizedGender),
  }));
}

// Fields worked out on each read, for search results and the profile page.
function liveFields(dob: string, gender: "male" | "female") {
  return {
    age: ageFromIsoDobUtc(dob) ?? undefined,
    lastSeen: Date.now(),
    emailVerified: true,
    // Opposite gender, same as the seeded users in the backend.
    genderPreference: gender === "male" ? "female" : "male",
  };
}

let byUserId: Map<string, { template: FakeProfileTemplate; gender: "male" | "female" }> | null = null;

// Looks up a fake profile by id (null if it isn't one), shaped like the backend's public
// profile. Lets the profile route answer fake ids without calling the backend.
export function getFakeProfileById(userId: string): ProfileResponse | null {
  if (!byUserId) {
    byUserId = new Map();
    for (const entry of Object.values(DATA)) {
      for (const gender of ["male", "female"] as const) {
        for (const template of entry[gender] ?? []) {
          byUserId.set(template.userId, { template, gender });
        }
      }
    }
  }
  const found = byUserId.get(userId);
  if (!found) return null;
  const { template, gender } = found;
  return {
    ...template,
    gender: template.gender ?? gender,
    photos: template.photos ?? [],
    ...liveFields(template.dob, gender),
  };
}
