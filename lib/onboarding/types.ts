export type OnboardingStatus = "signup_stub" | "needs_photos" | "complete" | string;

export type ProfileResponse = {
  userId?: string;
  email?: string;
  phone?: string;
  /** Set by our own email verification, not Cognito's. */
  emailVerified?: boolean;
  onboardingStatus?: OnboardingStatus;
  /** false until the user has seen the photos step once. */
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
  /** Epoch ms. */
  lastSeen?: number;
  /** Optional details (option keys from lib/profileDetails.ts). */
  likes?: string[];
  ethnicity?: string;
  race?: string;
  bodyType?: string;
  heightCm?: number;
  /** Either end can be set on its own. */
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
