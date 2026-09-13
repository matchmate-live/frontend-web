"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn, signInWithRedirect, signUp } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { configureAmplifyAuth } from "@/lib/amplify";
import FloatingInput from "@/components/ui/FloatingInput";
import HelpTooltipIcon from "@/components/ui/HelpTooltipIcon";
import AdSlot from "@/components/ads/AdSlot";
import MobileDrawer from "@/components/home/MobileDrawer";
import Logo from "@/icons/logo.svg";
import { ADS_SLOTS } from "@/lib/adsConfig";
import {
  AuthFieldErrors,
  normalizePhoneForCognito,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validatePhoneNumber,
} from "@/lib/authValidation";
import {
  fetchMyProfile,
  getPostAuthRedirectPath,
  isSafeRelativeAppPath,
  postSignupBootstrap,
  withOnboardingQuery,
} from "@/lib/onboarding";

type Mode = "signIn" | "signUp";

type Props = {
  mode: Mode;
  initialEmail?: string;
  /** Safe in-app path after sign-in (e.g. `/onboarding/profile`). */
  nextHref?: string;
};

const PASSWORD_REQUIREMENTS_TEXT =
  "Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.";

/** Post-authentication redirect shared by sign-in and (now auto-confirmed, immediately signed-in) sign-up. */
async function redirectAfterAuth(
  router: ReturnType<typeof useRouter>,
  nextHref: string | undefined,
) {
  try {
    const profile = await fetchMyProfile();
    const dest = getPostAuthRedirectPath(profile);
    if (dest !== "/") {
      router.push(withOnboardingQuery(dest));
      return;
    }
    if (nextHref && isSafeRelativeAppPath(nextHref)) {
      router.push(nextHref);
      return;
    }
    router.push("/");
  } catch {
    router.push("/");
  }
}

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
  const leftSlot = mode === "signUp" ? ADS_SLOTS.authSignUpLeft : ADS_SLOTS.authSignInLeft;
  const rightSlot = mode === "signUp" ? ADS_SLOTS.authSignUpRight : ADS_SLOTS.authSignInRight;
  const mobileTopSlot =
    mode === "signUp" ? ADS_SLOTS.authSignUpMobileTop : ADS_SLOTS.authSignInMobileTop;
  const mobileBottomSlot =
    mode === "signUp" ? ADS_SLOTS.authSignUpMobileBottom : ADS_SLOTS.authSignInMobileBottom;

  return (
    <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
      <nav className="w-full border-b border-pink-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link className="flex items-center gap-2 text-xl font-semibold text-pink-300" href="/">
            <Logo className="h-7 w-7 shrink-0" aria-hidden />
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
      <MobileDrawer isLoggedIn={false} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="mx-auto grid w-full max-w-7xl items-start gap-6 px-6 py-6 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[240px_minmax(0,1fr)_240px]">
        <aside className="hidden lg:block">
          <div className="h-[calc(100vh-2rem)] rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
            <AdSlot className="block h-[calc(100vh-8rem)] w-full rounded-md bg-pink-50/50" slot={leftSlot} />
          </div>
        </aside>

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-between sm:min-h-0 lg:self-center">
          <div className="mb-4 lg:hidden">
            <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
              <AdSlot className="block min-h-[140px] w-full rounded-md bg-pink-50/50" slot={mobileTopSlot} />
            </div>
          </div>

          <p className="mb-3 flex items-center justify-center gap-2 text-center text-xl font-semibold text-pink-300 sm:hidden">
            <Logo className="h-6 w-6 shrink-0" aria-hidden />
            MatchMate.live
          </p>

          <div className="w-full p-0 sm:rounded-2xl sm:border sm:border-pink-200 sm:bg-white sm:p-6 sm:shadow-sm">
            <p className="mb-3 hidden items-center justify-center gap-2 text-center text-2xl font-semibold text-pink-300 sm:flex">
              <Logo className="h-7 w-7 shrink-0" aria-hidden />
              MatchMate.live
            </p>
            <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
            <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>

          <div className="mt-4 lg:hidden">
            <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
              <AdSlot
                className="block min-h-[140px] w-full rounded-md bg-pink-50/50"
                slot={mobileBottomSlot}
              />
            </div>
          </div>
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

export default function AuthCard({ mode, initialEmail = "", nextHref }: Props) {
  const isConfigured = configureAmplifyAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

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
        await redirectAfterAuth(router, nextHref);
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
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email, phone_number: normalizedPhone },
        },
      });
      const userSub = result.userId;
      if (userSub) {
        const boot = await postSignupBootstrap({
          userSub,
          email,
          phone: normalizedPhone,
        });
        if (!boot.ok) {
          setError(boot.message);
          setBusy(false);
          return;
        }
      }
      // No confirmation step: the account is auto-confirmed server-side (see
      // backend preSignUpAutoConfirm) — sign in immediately rather than making
      // the user re-enter their password on a separate screen.
      const signInResult = await signIn({ username: email, password });
      if (signInResult.nextStep.signInStep === "DONE") {
        await redirectAfterAuth(router, nextHref);
        return;
      }
      setError(`Next step: ${signInResult.nextStep.signInStep}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
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
