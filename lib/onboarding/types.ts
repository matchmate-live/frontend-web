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
  /** Optional details — option keys, see lib/profileDetails.ts. Absent when not set. */
  likes?: string[];
  ethnicity?: string;
  race?: string;
  bodyType?: string;
  heightCm?: number;
  /** Either end may be set alone: min only = "min and up", max only = "18 up to max". */
  seekingAgeMin?: number;
  seekingAgeMax?: number;
};

export type OnboardingProfileFieldErrors = Partial<{
  name: string;
  dob: string;
  country: string;
  city: string;
  gender: string;
  genderPreference: string;
}>;
