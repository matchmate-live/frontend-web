import { fetchAuthSession } from "aws-amplify/auth";
import type { ProfileResponse } from "@/lib/onboarding/types";
import { ApiError, throwApiError } from "@/lib/api/clientError";

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

async function authHeader(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    throw new ApiError(401, "Not signed in");
  }
  return { Authorization: `Bearer ${token}` };
}

/**
 * Loads another member's profile (or your own) for /profile/[userId].
 * Relies on Cache-Control from the API route for HTTP caching.
 * Pass `signal` from an AbortController so React Strict Mode / navigation can cancel the request.
 */
export async function fetchProfileByUserId(
  userId: string,
  options?: { signal?: AbortSignal },
): Promise<ProfileResponse> {
  const headers = await authHeader();
  const res = await fetch(`/api/profiles/${encodeURIComponent(userId)}`, {
    headers,
    signal: options?.signal,
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  const data = (await res.json()) as ProfileResponse;
  return stripProfileViewFields(data);
}
