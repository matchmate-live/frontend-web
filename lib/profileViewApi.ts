import { fetchAuthSession } from "aws-amplify/auth";
import type { ProfileResponse } from "@/lib/onboarding/types";
import { throwApiError } from "@/lib/api/clientError";

const PROFILE_VIEW_STRIP_KEYS = [
  "phone",
  "onboardingPhotosPromptCompleted",
  "onboardingStatus",
  "email",
] as const;

function stripProfileViewFields(profile: ProfileResponse): ProfileResponse {
  const out: Record<string, unknown> = { ...profile };
  for (const key of PROFILE_VIEW_STRIP_KEYS) {
    delete out[key];
  }
  return out as ProfileResponse;
}

// Adds the token if signed in. This route is public, so no token is fine here.
async function optionalAuthHeader(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Loads a profile for /profile/[userId]. Works signed out too (you get the public view).
// Pass `signal` so the request can be cancelled.
export async function fetchProfileByUserId(
  userId: string,
  options?: { signal?: AbortSignal; noStore?: boolean },
): Promise<ProfileResponse> {
  const headers = await optionalAuthHeader();
  const res = await fetch(`/api/profiles/${encodeURIComponent(userId)}`, {
    headers,
    signal: options?.signal,
    // Profiles are cached for 3h, too long for online status, so skip the cache here.
    cache: options?.noStore ? "no-store" : undefined,
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  const data = (await res.json()) as ProfileResponse;
  return stripProfileViewFields(data);
}
