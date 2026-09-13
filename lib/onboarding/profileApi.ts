import { fetchAuthSession } from "aws-amplify/auth";
import type { ProfileResponse } from "./types";
import { throwApiError } from "@/lib/api/clientError";

async function authHeader(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    throw new Error("Not signed in");
  }
  return { Authorization: `Bearer ${token}` };
}

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
  return res.json() as Promise<ProfileResponse>;
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
