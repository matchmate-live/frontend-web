import { ONBOARDING_QUERY, ONBOARDING_ROUTES, PROFILE_GATE_SKIP_PREFIXES } from "./constants";
import type { ProfileResponse } from "./types";

/** Where to send the user after OAuth or sign-in when `next` is not set. */
export function getPostAuthRedirectPath(profile: ProfileResponse | null): string {
  if (!profile) {
    return ONBOARDING_ROUTES.profile;
  }
  if (profile.onboardingStatus !== "complete") {
    return ONBOARDING_ROUTES.profile;
  }
  if (profile.onboardingPhotosPromptCompleted === false) {
    return ONBOARDING_ROUTES.photos;
  }
  return "/";
}

/** Adds query flags for onboarding messaging and first-time photos step. */
export function withOnboardingQuery(dest: string): string {
  if (dest === "/") {
    return "/";
  }
  const base = dest.split("?")[0] ?? dest;
  const qs = new URLSearchParams({ [ONBOARDING_QUERY.completeProfile]: "1" });
  if (base === ONBOARDING_ROUTES.photos || base.startsWith(`${ONBOARDING_ROUTES.photos}/`)) {
    qs.set(ONBOARDING_QUERY.firstVisit, "1");
  }
  return `${base}?${qs.toString()}`;
}

export function shouldSkipProfileGate(pathname: string | null): boolean {
  if (!pathname) return true;
  return PROFILE_GATE_SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
