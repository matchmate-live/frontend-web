import { MAX_IMAGE_BYTES } from "@/lib/imageUpload";
import { MAX_PROFILE_AGE, MIN_PROFILE_AGE } from "./constants";
import type { OnboardingProfileFieldErrors } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDateString(s: string): boolean {
  return ISO_DATE.test(s.trim());
}

function parseUtcMidnightParts(iso: string): { y: number; m: number; d: number } | null {
  const t = iso.trim();
  if (!isIsoDateString(t)) return null;
  const [y, m, d] = t.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  return { y, m, d };
}

/** Age in full years at UTC date boundary (aligned with typical `type="date"` behavior). */
export function ageFromIsoDobUtc(iso: string): number | null {
  const parts = parseUtcMidnightParts(iso);
  if (!parts) return null;
  const today = new Date();
  const ty = today.getUTCFullYear();
  const tm = today.getUTCMonth() + 1;
  const td = today.getUTCDate();
  let age = ty - parts.y;
  if (tm < parts.m || (tm === parts.m && td < parts.d)) age -= 1;
  return age;
}

export function validateDobAgeRange(iso: string): string | undefined {
  if (!isIsoDateString(iso)) {
    return "Date of birth must be YYYY-MM-DD.";
  }
  const age = ageFromIsoDobUtc(iso);
  if (age === null) return "Invalid date of birth.";
  if (age < MIN_PROFILE_AGE) {
    return `You must be at least ${MIN_PROFILE_AGE} years old.`;
  }
  if (age > MAX_PROFILE_AGE) {
    return `You must be at most ${MAX_PROFILE_AGE} years old.`;
  }
  return undefined;
}

/** Latest YYYY-MM-DD so age >= minAge (UTC; aligned with backend `calculateAge`). */
export function maxIsoDobForMinAgeUtc(minAge: number): string {
  const now = new Date();
  const y = now.getUTCFullYear() - minAge;
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Earliest YYYY-MM-DD so age <= maxAge (UTC). */
export function minIsoDobForMaxAgeUtc(maxAge: number): string {
  const now = new Date();
  const y = now.getUTCFullYear() - maxAge;
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export type OnboardingProfileInput = {
  name: string;
  dob: string;
  country: string;
  city: string;
  gender: string;
  genderPreference: string;
};

/**
 * Validates onboarding profile step fields before submit.
 * Returns `undefined` when valid, otherwise a single user-facing message (legacy) or use `validateOnboardingProfileFieldsDetailed`.
 */
export function validateOnboardingProfileMessage(input: OnboardingProfileInput): string | undefined {
  const detailed = validateOnboardingProfileFieldsDetailed(input);
  if (detailed.ok) return undefined;
  const first = Object.values(detailed.errors).find(Boolean);
  return first ?? "Please check your profile details.";
}

export function validateOnboardingProfileFieldsDetailed(input: OnboardingProfileInput): {
  ok: boolean;
  errors: OnboardingProfileFieldErrors;
} {
  const errors: OnboardingProfileFieldErrors = {};
  if (!input.name.trim()) {
    errors.name = "Display name is required.";
  }
  const dobErr = validateDobAgeRange(input.dob);
  if (dobErr) errors.dob = dobErr;
  if (!input.country?.trim()) {
    errors.country = "Country is required.";
  }
  if (!input.city?.trim()) {
    errors.city = "City is required.";
  }
  if (input.gender !== "male" && input.gender !== "female") {
    errors.gender = "Gender is required.";
  }
  if (input.genderPreference !== "male" && input.genderPreference !== "female") {
    errors.genderPreference = "Who you want to meet is required.";
  }
  const ok = Object.keys(errors).length === 0;
  return { ok, errors };
}

/** Reject open redirects and non-app paths. */
export function isSafeRelativeAppPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.includes("\0")) return false;
  return true;
}

export function validateImageFileBeforeProcessing(file: File): string | undefined {
  if (file.size > MAX_IMAGE_BYTES) {
    return "Each image must be 5 MB or smaller.";
  }
  return undefined;
}
