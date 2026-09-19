import type { SearchProfile } from "@/lib/search";
import { ageFromIsoDobUtc } from "@/lib/onboarding/validation";
import fakeProfilesDataDev from "./data.dev.json";
import fakeProfilesDataProd from "./data.prod.json";

// Stored as `dob`, not `age` — age is derived at read time (ageFromIsoDobUtc below), same
// as real profiles, so it doesn't freeze at whatever value it was when the data was
// generated and quietly go stale as real time passes.
type FakeProfileTemplate = Omit<SearchProfile, "lastSeen" | "age"> & { dob: string };
type CountryEntry = { male: FakeProfileTemplate[]; female: FakeProfileTemplate[] };

// `next build` (any deployed environment) sets NODE_ENV=production; only `next dev` is
// "development" — so this is "local dev" vs. "everything built/deployed", not a specific
// AWS backend stage. Both files start as identical copies (see scripts/generateFakeProfiles.mjs)
// and are free to diverge by hand from here — e.g. trying out new bios in dev only.
const DATA = (
  process.env.NODE_ENV === "production" ? fakeProfilesDataProd : fakeProfilesDataDev
) as Record<string, CountryEntry>;

/**
 * Fixed filler profiles (3-10 per gender per country, varied per country rather than a
 * uniform count — from lib/fakeProfiles/data.{dev,prod}.json, regenerate via
 * scripts/generateFakeProfiles.mjs, never computed at request time) shown alongside real
 * search results, always stamped as online right now.
 *
 * Rules: pick the profiles matching the requested gender for that country. If no city was
 * requested, return all of them. If a city was requested and any are assigned to it, return
 * only those; otherwise fall back to the full set (a specific-but-unmatched city still gets
 * filler, rather than none).
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
    age: ageFromIsoDobUtc(dob) ?? undefined,
    lastSeen: Date.now(),
    emailVerified: true,
  }));
}
