export type OnboardingStatus = "signup_stub" | "needs_photos" | "complete" | string;

export type ProfileResponse = {
  userId?: string;
  email?: string;
  phone?: string;
  /** Set by the app's own SES-based verification flow, not Cognito's built-in one. */
  emailVerified?: boolean;
  onboardingStatus?: OnboardingStatus;
  /** false = must see optional photos screen once; true = done (or legacy account). */
  onboardingPhotosPromptCompleted?: boolean;
  name?: string;
  description?: string;
  dob?: string;
  country?: string;
  city?: string;
  gender?: string;
  genderPreference?: string;
  photos?: string[];
  age?: number;
  /** Epoch ms; present on search and profile views. */
  lastSeen?: number;
};

export type OnboardingProfileFieldErrors = Partial<{
  name: string;
  dob: string;
  country: string;
  city: string;
  gender: string;
  genderPreference: string;
}>;
