/**
 * @deprecated Import from `@/lib/onboarding` instead. Kept for old imports.
 */
export type { OnboardingStatus, ProfileResponse } from "./onboarding/types";
export {
  fetchMyProfile,
  presignUpload,
  updateMyProfile,
} from "./onboarding/profileApi";
export { getPostAuthRedirectPath, withOnboardingQuery } from "./onboarding/routing";
