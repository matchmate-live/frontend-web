import { fetchAuthSession } from "aws-amplify/auth";
import type { ProfileResponse } from "./types";

async function authHeader(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    throw new Error("Not signed in");
  }
  return { Authorization: `Bearer ${token}` };
}

async function parseErrorMessage(res: Response, data: unknown): Promise<string> {
  const body = data as { message?: string };
  return typeof body.message === "string" ? body.message : `Request failed (${res.status})`;
}

export async function fetchMyProfile(): Promise<ProfileResponse | null> {
  const headers = await authHeader();
  let res = await fetch("/api/profiles/me", { headers, cache: "no-store" });
  if (res.status === 404) {
    const ensure = await fetch("/api/signup/ensure", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
    const ensured = await ensure.json().catch(() => ({}));
    if (!ensure.ok) {
      throw new Error(await parseErrorMessage(ensure, ensured));
    }
    return ensured as ProfileResponse;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(await parseErrorMessage(res, err));
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, data));
  }
  return data as ProfileResponse;
}

export async function presignUpload(): Promise<{ uploadUrl: string; key: string }> {
  const headers = await authHeader();
  const res = await fetch("/api/media/presign", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({}),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, data));
  }
  return data as { uploadUrl: string; key: string };
}
