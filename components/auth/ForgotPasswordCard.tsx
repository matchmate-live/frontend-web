"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signIn } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { configureAmplifyAuth } from "@/lib/amplify";
import FloatingInput from "@/components/ui/FloatingInput";
import PasswordVisibilityToggle from "@/components/ui/PasswordVisibilityToggle";
import { CardShell, ErrorText, redirectAfterAuth } from "@/components/auth/AuthCard";
import { handOffEmail, takeHandedOffEmail } from "@/lib/auth/emailHandoff";
import { requestPasswordResetCode, resetPasswordWithCode } from "@/lib/auth/passwordReset";
import {
  AuthFieldErrors,
  validateConfirmPassword,
  validateConfirmationCode,
  validateEmail,
  validatePassword,
} from "@/lib/authValidation";

const PASSWORD_REQUIREMENTS_TEXT =
  "Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.";

const RESEND_COOLDOWN_SECONDS = 60;

// Forgot password: email → code + new password → signed in.
export default function ForgotPasswordCard() {
  const isConfigured = configureAmplifyAuth();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [backFromCodeStep, setBackFromCodeStep] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // Email typed on the sign-in page, if any. Read after mount (sessionStorage isn't available
  // during server rendering) and deferred so the update doesn't run inside the effect itself.
  useEffect(() => {
    const handedOff = takeHandedOffEmail();
    if (handedOff) void Promise.resolve().then(() => setEmail((prev) => prev || handedOff));
  }, []);

  // Matches the backend's 60-second resend cooldown, so a quick second click doesn't use up
  // one of the day's code requests without sending anything.
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

  async function sendCode() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await requestPasswordResetCode(email.trim());
      startCooldown();
      setStep("reset");
      setNotice(
        `If ${email.trim()} has a MatchMate password, we've emailed it a 6-digit code. It expires in 10 minutes.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      return;
    }
    void sendCode();
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: AuthFieldErrors = {
      code: validateConfirmationCode(code),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    if (nextErrors.code || nextErrors.password || nextErrors.confirmPassword) {
      setFieldErrors(nextErrors);
      return;
    }
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await resetPasswordWithCode(email.trim(), code.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset your password. Please try again.");
      setBusy(false);
      return;
    }

    // Password changed: sign in with it. If that fails, send them to the sign-in page with
    // their email filled in.
    try {
      if (isConfigured) {
        const result = await signIn({ username: email.trim(), password });
        if (result.nextStep.signInStep === "DONE") {
          await redirectAfterAuth(router, undefined);
          return;
        }
      }
    } catch {
      // Fall through to the sign-in page.
    }
    handOffEmail(email);
    router.push("/auth/sign-in");
  }

  const backToSignIn = (
    <p className="mt-4 text-sm text-zinc-600">
      Remembered it?{" "}
      <Link className="text-pink-300 underline" href="/auth/sign-in" onClick={() => handOffEmail(email)}>
        Sign in
      </Link>
    </p>
  );

  if (step === "email") {
    return (
      <CardShell mode="signIn" subtitle="Enter your email and we'll send you a code to reset it." title="Reset password">
        {error && <ErrorText text={error} />}
        <form className="space-y-3" onSubmit={handleSendCode}>
          <FloatingInput
            error={fieldErrors.email}
            // Focused only when coming back from the code step, not on first load (it would
            // pop up the keyboard on phones).
            autoFocus={backFromCodeStep}
            autoComplete="username"
            label="Email"
            required
            type="email"
            value={email}
            onBlur={() => setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
            onChange={(value) => {
              setEmail(value);
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
          />
          <button
            className="w-full cursor-pointer rounded-md bg-pink-300 p-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? "Sending..." : "Send code"}
          </button>
        </form>
        <p className="mt-3 text-xs text-zinc-500">Signed up with Google? Use Continue with Google instead.</p>
        {backToSignIn}
      </CardShell>
    );
  }

  return (
    <CardShell mode="signIn" subtitle={`Enter the code we sent to ${email.trim()}.`} title="Choose a new password">
      {error && <ErrorText text={error} />}
      {!error && notice ? (
        // role="status": screen readers read it out politely, without interrupting.
        <p className="mb-3 rounded-md bg-emerald-50 p-2 text-sm text-emerald-700" role="status">
          {notice}
        </p>
      ) : null}
      <form className="space-y-3" onSubmit={handleReset}>
        <FloatingInput
          error={fieldErrors.code}
          // Only shown after "Send code", so focusing it tells keyboard and screen reader users
          // the step changed.
          autoFocus
          autoComplete="one-time-code"
          inputMode="numeric"
          label="6-digit code"
          required
          value={code}
          onBlur={() => setFieldErrors((prev) => ({ ...prev, code: validateConfirmationCode(code) }))}
          onChange={(value) => {
            setCode(value);
            setFieldErrors((prev) => ({ ...prev, code: undefined }));
          }}
        />
        <div>
          <FloatingInput
            error={fieldErrors.password}
            autoComplete="new-password"
            label="New password"
            required
            type={showPassword ? "text" : "password"}
            value={password}
            onBlur={() => setFieldErrors((prev) => ({ ...prev, password: validatePassword(password) }))}
            onChange={(value) => {
              setPassword(value);
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            endAdornment={
              <PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            }
          />
          {!fieldErrors.password ? (
            <p className="mt-1 text-xs leading-snug text-zinc-500">{PASSWORD_REQUIREMENTS_TEXT}</p>
          ) : null}
        </div>
        <FloatingInput
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
          label="Confirm new password"
          required
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onBlur={() =>
            setFieldErrors((prev) => ({
              ...prev,
              confirmPassword: validateConfirmPassword(password, confirmPassword),
            }))
          }
          onChange={(value) => {
            setConfirmPassword(value);
            setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          endAdornment={
            <PasswordVisibilityToggle
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((v) => !v)}
            />
          }
        />
        <button
          className="w-full cursor-pointer rounded-md bg-pink-300 p-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? "Saving..." : "Reset password"}
        </button>
      </form>
      <div className="mt-3 flex justify-between text-sm">
        <button
          className="cursor-pointer text-pink-300 underline disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy || cooldown > 0}
          type="button"
          onClick={() => void sendCode()}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
        <button
          className="cursor-pointer text-zinc-600 underline disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          type="button"
          onClick={() => {
            setBackFromCodeStep(true);
            setStep("email");
            setCode("");
            setError("");
            setNotice("");
          }}
        >
          Use a different email
        </button>
      </div>
      {backToSignIn}
    </CardShell>
  );
}
