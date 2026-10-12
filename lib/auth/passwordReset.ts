import { throwApiError } from "@/lib/api/clientError";

async function post(path: string, body: unknown): Promise<void> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    await throwApiError(res);
  }
}

// Emails a reset code if an email/password account exists. Succeeds either way.
export function requestPasswordResetCode(email: string): Promise<void> {
  return post("/api/auth/password/forgot", { email });
}

// Sets the new password if the code is right.
export function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<void> {
  return post("/api/auth/password/reset", { email, code, newPassword });
}
