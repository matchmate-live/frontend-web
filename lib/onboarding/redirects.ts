import { ONBOARDING_ROUTES } from "./constants";
import { withOnboardingQuery } from "./routing";
import type { ProfileResponse } from "./types";

/**
 * If the user should leave the profile onboarding step, returns the path; otherwise `null`.
 */
export function getRedirectFromProfileStep(profile: ProfileResponse): string | null {
  if (profile.onboardingStatus === "complete") {
    if (profile.onboardingPhotosPromptCompleted !== false) {
      return "/";
    }
    return withOnboardingQuery(ONBOARDING_ROUTES.photos);
  }
  return null;
}

/**
 * If the user should leave the photos onboarding step, returns the path; otherwise `null`.
 */
export function getRedirectFromPhotosStep(profile: ProfileResponse): string | null {
  if (profile.onboardingStatus === "signup_stub" || profile.onboardingStatus !== "complete") {
    return ONBOARDING_ROUTES.profile;
  }
  return null;
}
