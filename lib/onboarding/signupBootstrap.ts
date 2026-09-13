import type { BootstrapSignupBody } from "./types";
import { readApiErrorMessage } from "@/lib/api/clientError";

export type BootstrapResult =
  | { ok: true; status: number }
  | { ok: false; status: number; message: string };

/**
 * Creates the DynamoDB stub after Cognito sign-up. Idempotent: 409 is treated as success.
 */
export async function postSignupBootstrap(body: BootstrapSignupBody): Promise<BootstrapResult> {
  const trimmedSub = body.userSub.trim();
  const trimmedEmail = body.email.trim();
  const trimmedPhone = body.phone.trim();
  if (!trimmedSub || !trimmedEmail || !trimmedPhone) {
    return { ok: false, status: 400, message: "Missing signup details." };
  }

  const res = await fetch("/api/signup/bootstrap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userSub: trimmedSub,
      email: trimmedEmail,
      phone: trimmedPhone,
    }),
  });

  if (res.ok || res.status === 409) {
    return { ok: true, status: res.status };
  }

  return {
    ok: false,
    status: res.status,
    message: await readApiErrorMessage(res, "Could not save your account details. Try again."),
  };
}
