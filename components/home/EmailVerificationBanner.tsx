"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { confirmEmailVerificationCode, fetchMyProfile, requestEmailVerificationCode } from "@/lib/onboarding";
import { validateConfirmationCode } from "@/lib/authValidation";
import { isSessionExpiredError } from "@/lib/api/authRedirect";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Nudges a logged-in user with an unverified email to verify it, and handles the whole
 * request-code / enter-code flow inline. Renders nothing for anonymous visitors or once
 * verified. This app verifies email itself via SES rather than Cognito's own built-in
 * flow (see backend docs/authentication.md) — sign-up no longer blocks on a code, so
 * verification happens here instead, whenever the user chooses to.
 */
export default function EmailVerificationBanner() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [justVerified, setJustVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (authLoading || !isLoggedIn) return;
    let cancelled = false;
    fetchMyProfile()
      .then((profile) => {
        if (!cancelled) setEmailVerified(profile?.emailVerified === true);
      })
      .catch(() => {
        if (!cancelled) setEmailVerified(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // A real 401 already triggered the session-expired toast (see clientError.ts); this
  // just needs to skip the redundant inline error for that one case.
  function handleAuthError(err: unknown, fallbackMessage: string) {
    if (!isSessionExpiredError(err)) {
      setError(err instanceof Error ? err.message : fallbackMessage);
    }
  }

  async function handleSendCode() {
    setError("");
    setSending(true);
    try {
      await requestEmailVerificationCode();
      setCodeSent(true);
      startCooldown();
    } catch (err) {
      handleAuthError(err, "Could not send a code. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleConfirmCode(e: React.FormEvent) {
    e.preventDefault();
    const err = validateConfirmationCode(code);
    if (err) {
      setCodeError(err);
      return;
    }
    setCodeError(undefined);
    setError("");
    setConfirming(true);
    try {
      await confirmEmailVerificationCode(code.trim());
      setEmailVerified(true);
      setJustVerified(true);
      setTimeout(() => setJustVerified(false), 4000);
    } catch (confirmErr) {
      handleAuthError(confirmErr, "Incorrect code. Try again.");
    } finally {
      setConfirming(false);
    }
  }

  if (!isLoggedIn) return null;
  if (emailVerified !== false && !justVerified) return null;

  if (justVerified) {
    return (
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
        Email verified successfully.
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-pink-200 bg-pink-50/60 p-4">
      <h2 className="text-sm font-semibold text-zinc-900">Verify your email</h2>
      <p className="mt-1 text-sm text-zinc-700">
        Confirm your email address to help secure your account. This only takes a minute.
      </p>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      {!codeSent ? (
        <button
          className="mt-3 cursor-pointer rounded-md bg-pink-300 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={sending}
          type="button"
          onClick={() => void handleSendCode()}
        >
          {sending ? "Sending…" : "Send verification code"}
        </button>
      ) : (
        <form className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start" onSubmit={handleConfirmCode}>
          <div className="flex-1">
            <input
              aria-label="Verification code"
              className="w-full rounded-md border border-pink-200 px-3 py-2 text-sm text-zinc-900 sm:max-w-[160px]"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeError(undefined);
              }}
            />
            {codeError ? <p className="mt-1 text-xs text-red-700">{codeError}</p> : null}
          </div>
          <button
            className="cursor-pointer rounded-md bg-pink-300 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={confirming}
            type="submit"
          >
            {confirming ? "Confirming…" : "Confirm"}
          </button>
          <button
            className="cursor-pointer rounded-md border border-pink-200 bg-white px-4 py-2 text-sm text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={sending || cooldown > 0}
            type="button"
            onClick={() => void handleSendCode()}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : sending ? "Sending…" : "Resend code"}
          </button>
        </form>
      )}
    </div>
  );
}
