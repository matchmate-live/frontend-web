import type { ProfileResponse } from "./types";
import { throwApiError } from "@/lib/api/clientError";
import { authHeader } from "@/lib/api/authHeader";
import { getCachedProfileIfFresh, setMyProfileCache } from "./myProfileCache";

export async function fetchMyProfile(): Promise<ProfileResponse | null> {
  const headers = await authHeader();
  const res = await fetch("/api/profiles/me", { headers, cache: "no-store" });
  if (res.status === 404) {
    const ensure = await fetch("/api/signup/ensure", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
    if (!ensure.ok) {
      await throwApiError(ensure);
    }
    return ensure.json() as Promise<ProfileResponse>;
  }
  if (!res.ok) {
    await throwApiError(res);
  }
  return res.json() as Promise<ProfileResponse>;
}

let fetchMyProfileInFlight: Promise<ProfileResponse | null> | null = null;

/**
 * Cached wrapper around fetchMyProfile (see myProfileCache.ts) — "my profile" rarely
 * changes session to session, so re-fetching it on every caller is wasted cost. An
 * in-flight request is shared across simultaneous callers. updateMyProfile below seeds the
 * cache with each write's result, so this tab's own edits are never served stale.
 */
export async function fetchMyProfileCached(options?: { forceRefresh?: boolean }): Promise<ProfileResponse | null> {
  if (!options?.forceRefresh) {
    const cached = getCachedProfileIfFresh();
    if (cached) return cached;
  }
  if (!fetchMyProfileInFlight) {
    fetchMyProfileInFlight = fetchMyProfile()
      .then((profile) => {
        if (profile) setMyProfileCache(profile);
        return profile;
      })
      .finally(() => {
        fetchMyProfileInFlight = null;
      });
  }
  return fetchMyProfileInFlight;
}

export async function updateMyProfile(body: Record<string, unknown>): Promise<ProfileResponse> {
  const headers = await authHeader();
  const res = await fetch("/api/profiles/me", {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  const profile = (await res.json()) as ProfileResponse;
  setMyProfileCache(profile);
  return profile;
}

export async function presignUpload(): Promise<{ uploadUrl: string; key: string }> {
  const headers = await authHeader();
  const res = await fetch("/api/media/presign", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({}),
    cache: "no-store",
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  return res.json() as Promise<{ uploadUrl: string; key: string }>;
}

/** Deletes one of the caller's own previously-uploaded photos from storage. */
export async function deleteUploadedPhoto(key: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch("/api/media/delete", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
    cache: "no-store",
  });
  if (!res.ok) {
    await throwApiError(res);
  }
}

/** Sends a 6-digit verification code to the caller's own registered email (via SES, not Cognito's). */
export async function requestEmailVerificationCode(): Promise<void> {
  const headers = await authHeader();
  const res = await fetch("/api/email/verify/request", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store",
  });
  if (!res.ok) {
    await throwApiError(res);
  }
}

/** Confirms the code sent by requestEmailVerificationCode. */
export async function confirmEmailVerificationCode(code: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch("/api/email/verify/confirm", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });
  if (!res.ok) {
    await throwApiError(res);
  }
}
