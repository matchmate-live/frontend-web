"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// signInWithRedirect is never called here — this import just pulls its module into this
// page's bundle. Amplify registers the listener that completes a pending OAuth exchange as
// a side effect of loading that module, and nothing else in the Auth package imports it.
// This page loads via a separate bundle (Google's cross-origin redirect) that previously
// never pulled that module in, so the listener was never registered and completion could
// never fire, no matter how long the page waited.
import { fetchAuthSession, signInWithRedirect } from "aws-amplify/auth";
void signInWithRedirect;
import { configureAmplifyAuth, resetAmplifyAuthState } from "@/lib/amplify";
import { fetchMyProfile, getPostAuthRedirectPath, withOnboardingQuery } from "@/lib/onboarding";

// Amplify completes the OAuth exchange asynchronously after mount; poll instead of timing
// a single check exactly right.
const POLL_INTERVAL_MS = 400;
const POLL_TIMEOUT_MS = 8000;

// Manual way out if nothing resolves by the time polling gives up.
const RECOVERY_DELAY_MS = 8500;

export default function AuthCallbackPage() {
  const isConfigured = configureAmplifyAuth();
  const router = useRouter();
  const [status, setStatus] = useState("Finishing sign-in...");
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      // Deferred to a microtask — avoids a same-tick cascading render (same as AuthProvider).
      Promise.resolve().then(() => setStatus("Missing Cognito env values. Configure .env.local first."));
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      while (!cancelled && Date.now() - startedAt < POLL_TIMEOUT_MS) {
        try {
          const session = await fetchAuthSession();
          if (session.tokens?.accessToken || session.tokens?.idToken) {
            const profile = await fetchMyProfile();
            if (cancelled) return;
            const dest = getPostAuthRedirectPath(profile);
            router.replace(dest === "/" ? "/" : withOnboardingQuery(dest));
            return;
          }
        } catch (err) {
          if (!cancelled) setStatus(err instanceof Error ? err.message : "OAuth callback failed.");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      if (!cancelled) setStatus("No session was created. Try signing in again.");
    }

    void poll();

    const recoveryTimer = setTimeout(() => {
      if (!cancelled) setShowRecovery(true);
    }, RECOVERY_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(recoveryTimer);
    };
  }, [router, isConfigured]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-black/70">{status}</p>
      {showRecovery ? (
        <div className="rounded-xl border border-pink-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-zinc-600">This is taking longer than expected.</p>
          <button
            className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-md bg-pink-300 px-4 py-2 text-sm font-medium text-white"
            type="button"
            onClick={() => {
              resetAmplifyAuthState();
              window.location.href = "/auth/sign-in";
            }}
          >
            Cancel and try again
          </button>
        </div>
      ) : null}
    </main>
  );
}
