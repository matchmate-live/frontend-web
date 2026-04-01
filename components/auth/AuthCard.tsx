"use client";

import Link from "next/link";
import { useState } from "react";
import {
  confirmSignUp,
  signIn,
  signInWithRedirect,
  signUp,
} from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { configureAmplifyAuth } from "@/lib/amplify";
import FloatingInput from "@/components/ui/FloatingInput";
import HelpTooltipIcon from "@/components/ui/HelpTooltipIcon";
import AdSlot from "@/components/ads/AdSlot";
import MobileDrawer from "@/components/home/MobileDrawer";
import { ADS_SLOTS } from "@/lib/adsConfig";
import {
  AuthFieldErrors,
  normalizePhoneForCognito,
  validateConfirmationCode,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validatePhoneNumber,
} from "@/lib/authValidation";

type Mode = "signIn" | "signUp" | "confirm";

type Props = {
  mode: Mode;
  initialEmail?: string;
};

const PASSWORD_REQUIREMENTS_TEXT =
  "Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.";

function CardShell({
  mode,
  title,
  subtitle,
  children,
}: {
  mode: Mode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const leftSlot =
    mode === "signUp"
      ? ADS_SLOTS.authSignUpLeft
      : mode === "signIn"
        ? ADS_SLOTS.authSignInLeft
        : ADS_SLOTS.authSignInLeft;
  const rightSlot =
    mode === "signUp"
      ? ADS_SLOTS.authSignUpRight
      : mode === "signIn"
        ? ADS_SLOTS.authSignInRight
        : ADS_SLOTS.authSignInRight;
  const mobileTopSlot =
    mode === "signUp"
      ? ADS_SLOTS.authSignUpMobileTop
      : mode === "signIn"
        ? ADS_SLOTS.authSignInMobileTop
        : ADS_SLOTS.authSignInMobileTop;
  const mobileBottomSlot =
    mode === "signUp"
      ? ADS_SLOTS.authSignUpMobileBottom
      : mode === "signIn"
        ? ADS_SLOTS.authSignInMobileBottom
        : ADS_SLOTS.authSignInMobileBottom;
  const showMobileAuthAds = mode === "signIn" || mode === "signUp";
  const showAuthBrand = mode === "signIn" || mode === "signUp";

  return (
    <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
      <nav className="w-full border-b border-pink-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link className="text-xl font-semibold text-pink-300" href="/">
            MatchMate.live
          </Link>
          <button
            aria-controls="mobile-nav-drawer"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            className="cursor-pointer rounded-md border border-pink-200 bg-white p-2 text-zinc-900"
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span className="block h-0.5 w-5 bg-zinc-900" />
            <span className="mt-1 block h-0.5 w-5 bg-zinc-900" />
            <span className="mt-1 block h-0.5 w-5 bg-zinc-900" />
          </button>
        </div>
      </nav>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="mx-auto grid w-full max-w-7xl items-start gap-6 px-6 py-6 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[240px_minmax(0,1fr)_240px]">
        <aside className="hidden lg:block">
          <div className="h-[calc(100vh-2rem)] rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
            <AdSlot className="block h-[calc(100vh-8rem)] w-full rounded-md bg-pink-50/50" slot={leftSlot} />
          </div>
        </aside>

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-between sm:min-h-0 lg:self-center">
          {showMobileAuthAds ? (
            <div className="mb-4 sm:hidden">
              <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
                <AdSlot className="block min-h-[140px] w-full rounded-md bg-pink-50/50" slot={mobileTopSlot} />
              </div>
            </div>
          ) : null}

          {showAuthBrand ? (
            <p className="mb-3 text-center text-xl font-semibold text-pink-300 sm:hidden">MatchMate.live</p>
          ) : null}

          <div className="w-full p-0 sm:rounded-2xl sm:border sm:border-pink-200 sm:bg-white sm:p-6 sm:shadow-sm">
            {showAuthBrand ? (
              <p className="mb-3 hidden text-center text-2xl font-semibold text-pink-300 sm:block">
                MatchMate.live
              </p>
            ) : null}
            <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
            <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>

          {showMobileAuthAds ? (
            <div className="mt-4 sm:hidden">
              <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
                <AdSlot
                  className="block min-h-[140px] w-full rounded-md bg-pink-50/50"
                  slot={mobileBottomSlot}
                />
              </div>
            </div>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <div className="h-[calc(100vh-2rem)] rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
            <AdSlot className="block h-[calc(100vh-8rem)] w-full rounded-md bg-pink-50/50" slot={rightSlot} />
          </div>
        </aside>
      </div>
    </main>
  );
}

function ErrorText({ text }: { text: string }) {
  return <p className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{text}</p>;
}

export default function AuthCard({ mode, initialEmail = "" }: Props) {
  const isConfigured = configureAmplifyAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");

  async function handleGoogle() {
    if (!isConfigured) {
      setError("Missing Cognito env values. Configure .env.local first.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await signInWithRedirect({ provider: "Google" });
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfigured) {
      setError("Missing Cognito env values. Configure .env.local first.");
      return;
    }
    const nextErrors: AuthFieldErrors = {
      email: validateEmail(email),
      password: password ? undefined : "Password is required.",
    };
    if (nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const result = await signIn({ username: email, password });
      if (result.nextStep.signInStep === "DONE") {
        router.push("/");
        return;
      }
      setError(`Next step: ${result.nextStep.signInStep}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfigured) {
      setError("Missing Cognito env values. Configure .env.local first.");
      return;
    }
    const nextErrors: AuthFieldErrors = {
      email: validateEmail(email),
      phoneNumber: validatePhoneNumber(phoneNumber),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    if (nextErrors.email || nextErrors.phoneNumber || nextErrors.password || nextErrors.confirmPassword) {
      setFieldErrors(nextErrors);
      return;
    }
    const normalizedPhone = normalizePhoneForCognito(phoneNumber);
    if (!normalizedPhone) return;
    setError("");
    setBusy(true);
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email, phone_number: normalizedPhone },
        },
      });
      router.push(`/auth/confirm?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfigured) {
      setError("Missing Cognito env values. Configure .env.local first.");
      return;
    }
    const nextErrors: AuthFieldErrors = {
      email: validateEmail(email),
      code: validateConfirmationCode(code),
    };
    if (nextErrors.email || nextErrors.code) {
      setFieldErrors(nextErrors);
      return;
    }
    setError("");
    setBusy(true);
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
      router.push("/auth/sign-in");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "signIn") {
    return (
      <CardShell mode={mode} title="Sign in" subtitle="Use your MatchMate.live account">
        {error && <ErrorText text={error} />}
        <form className="space-y-3" onSubmit={handleSignIn}>
          <FloatingInput
            error={fieldErrors.email}
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
          <FloatingInput
            error={fieldErrors.password}
            label="Password"
            required
            type="password"
            value={password}
            onBlur={() =>
              setFieldErrors((prev) => ({
                ...prev,
                password: password ? undefined : "Password is required.",
              }))
            }
            onChange={(value) => {
              setPassword(value);
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
          />
          <button
            className="w-full cursor-pointer rounded-md bg-pink-300 p-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <button
          className="mt-3 w-full cursor-pointer rounded-md border border-pink-200 bg-white p-2 text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          type="button"
          onClick={handleGoogle}
        >
          Continue with Google
        </button>
        <p className="mt-4 text-sm text-zinc-600">
          No account?{" "}
          <Link className="text-pink-300 underline" href="/auth/sign-up">
            Sign up
          </Link>
        </p>
      </CardShell>
    );
  }

  if (mode === "signUp") {
    return (
      <CardShell mode={mode} title="Sign up" subtitle="Create your MatchMate.live account">
        {error && <ErrorText text={error} />}
        <form className="space-y-3" onSubmit={handleSignUp}>
          <FloatingInput
            error={fieldErrors.email}
            label="Email"
            required
            type="email"
            value={email}
            onBlur={() => setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
            onChange={(value) => {
              setEmail(value);
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            endAdornment={
              <HelpTooltipIcon text="Your email is not shared with anyone. It is used for account records only." />
            }
          />
          <FloatingInput
            error={fieldErrors.phoneNumber}
            label="Phone number"
            required
            type="tel"
            value={phoneNumber}
            onBlur={() =>
              setFieldErrors((prev) => ({ ...prev, phoneNumber: validatePhoneNumber(phoneNumber) }))
            }
            onChange={(value) => {
              setPhoneNumber(value);
              setFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
            }}
            endAdornment={
              <HelpTooltipIcon text="Your phone number is not shared with anyone. It is used for account records only." />
            }
          />
          <FloatingInput
            error={fieldErrors.password}
            label="Password"
            required
            type="password"
            value={password}
            onBlur={() => setFieldErrors((prev) => ({ ...prev, password: validatePassword(password) }))}
            onChange={(value) => {
              setPassword(value);
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            endAdornment={<HelpTooltipIcon text={PASSWORD_REQUIREMENTS_TEXT} />}
          />
          <FloatingInput
            error={fieldErrors.confirmPassword}
            label="Confirm password"
            required
            type="password"
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
          />
          <button
            className="w-full cursor-pointer rounded-md bg-pink-300 p-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? "Creating..." : "Create account"}
          </button>
        </form>
        <button
          className="mt-3 w-full cursor-pointer rounded-md border border-pink-200 bg-white p-2 text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          type="button"
          onClick={handleGoogle}
        >
          Sign up with Google
        </button>
        <p className="mt-4 text-sm text-zinc-600">
          Already have one?{" "}
          <Link className="text-pink-300 underline" href="/auth/sign-in">
            Sign in
          </Link>
        </p>
      </CardShell>
    );
  }

  return (
    <CardShell mode={mode} title="Confirm account" subtitle="Enter the code sent to your email">
      {error && <ErrorText text={error} />}
      <form className="space-y-3" onSubmit={handleConfirm}>
        <FloatingInput
          error={fieldErrors.email}
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
        <FloatingInput
          error={fieldErrors.code}
          label="Confirmation code"
          required
          value={code}
          onBlur={() => setFieldErrors((prev) => ({ ...prev, code: validateConfirmationCode(code) }))}
          onChange={(value) => {
            setCode(value);
            setFieldErrors((prev) => ({ ...prev, code: undefined }));
          }}
        />
        <button
          className="w-full cursor-pointer rounded-md bg-pink-300 p-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? "Confirming..." : "Confirm and continue"}
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-600">
        Already confirmed?{" "}
        <Link className="text-pink-300 underline" href="/auth/sign-in">
          Go to sign in
        </Link>
      </p>
    </CardShell>
  );
}
