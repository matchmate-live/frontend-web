/**
 * @deprecated Import from `@/lib/onboarding` instead. This file re-exports for backward compatibility.
 */
export type { OnboardingStatus, ProfileResponse } from "./onboarding/types";
export {
  fetchMyProfile,
  presignUpload,
  updateMyProfile,
} from "./onboarding/profileApi";
export { getPostAuthRedirectPath, withOnboardingQuery } from "./onboarding/routing";
