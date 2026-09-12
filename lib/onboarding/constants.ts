/** Matches backend `profileOnboarding` age rules. */
export const MIN_PROFILE_AGE = 18;
export const MAX_PROFILE_AGE = 100;

export const ONBOARDING_ROUTES = {
  profile: "/onboarding/profile",
  photos: "/onboarding/photos",
} as const;

export const ONBOARDING_QUERY = {
  completeProfile: "completeProfile",
  firstVisit: "firstVisit",
} as const;

/** Paths where `ProfileCompletionGate` does not run. */
export const PROFILE_GATE_SKIP_PREFIXES = ["/auth", "/onboarding", "/profile", "/messages"] as const;

export const SKIP_PHOTOS_DIALOG_COPY =
  "Adding photos helps others connect with you and can improve your matches. You can add or change photos anytime in your profile settings. Continue without photos for now?";
