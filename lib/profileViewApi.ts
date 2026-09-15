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

/**
 * Attaches a bearer token when a session exists; returns empty headers otherwise. This
 * route is public — an anonymous visitor gets the redacted public view, not a 401 — so
 * unlike other API helpers in this app, having no token here is not an error.
 */
async function optionalAuthHeader(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Loads another member's profile (or your own) for /profile/[userId]. Works for signed-out
 * visitors too — the backend route has no authorizer and returns the redacted public view.
 * Relies on Cache-Control from the API route for HTTP caching.
 * Pass `signal` from an AbortController so React Strict Mode / navigation can cancel the request.
 */
export async function fetchProfileByUserId(
  userId: string,
  options?: { signal?: AbortSignal; noStore?: boolean },
): Promise<ProfileResponse> {
  const headers = await optionalAuthHeader();
  const res = await fetch(`/api/profiles/${encodeURIComponent(userId)}`, {
    headers,
    signal: options?.signal,
    // This route replies with a 3h Cache-Control for the normal browse/profile-page case,
    // which is right for name/photos/bio but wrong for a caller that specifically wants a
    // fresh online/last-seen status — opt out of the browser HTTP cache for that caller.
    cache: options?.noStore ? "no-store" : undefined,
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  const data = (await res.json()) as ProfileResponse;
  return stripProfileViewFields(data);
}
