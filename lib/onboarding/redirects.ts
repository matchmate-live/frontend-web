import { ONBOARDING_ROUTES } from "./constants";
import { withOnboardingQuery } from "./routing";
import type { ProfileResponse } from "./types";

// Where to send the user if they shouldn't be on the profile step, otherwise null.
export function getRedirectFromProfileStep(profile: ProfileResponse): string | null {
  if (profile.onboardingStatus === "complete") {
    if (profile.onboardingPhotosPromptCompleted !== false) {
      return "/";
    }
    return withOnboardingQuery(ONBOARDING_ROUTES.photos);
  }
  return null;
}

// Same for the about step, which only makes sense between the profile and photos steps.
// After onboarding these fields are in Settings > About me.
export function getRedirectFromAboutStep(profile: ProfileResponse): string | null {
  if (profile.onboardingStatus !== "complete") {
    return ONBOARDING_ROUTES.profile;
  }
  if (profile.onboardingPhotosPromptCompleted !== false) {
    return "/";
  }
  return null;
}

// Same for the photos step.
export function getRedirectFromPhotosStep(profile: ProfileResponse): string | null {
  if (profile.onboardingStatus === "signup_stub" || profile.onboardingStatus !== "complete") {
    return ONBOARDING_ROUTES.profile;
  }
  if (profile.onboardingPhotosPromptCompleted !== false) {
    return "/";
  }
  return null;
}
