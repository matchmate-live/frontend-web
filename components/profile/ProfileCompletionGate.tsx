"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  fetchMyProfileCached,
  getPostAuthRedirectPath,
  shouldSkipProfileGate,
  withOnboardingQuery,
} from "@/lib/onboarding";

// Renders immediately and redirects in the background if needed, instead of
// blocking every page load on this check (a no-op for most visitors).
export default function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, isLoggedIn } = useAuth();

  useEffect(() => {
    if (loading) return; // wait for the shared auth check to resolve
    if (!isLoggedIn) return; // anonymous visitor — nothing to gate
    if (shouldSkipProfileGate(pathname)) return;
    // On the search screen, search params only appear after a search already ran this
    // session — so their presence means the profile was already checked; skip re-checking
    // on every return trip to "/". Reads window.location directly, not useSearchParams(),
    // since this wraps every route and shouldn't force a Suspense boundary app-wide.
    if (pathname === "/" && typeof window !== "undefined" && window.location.search) return;

    let cancelled = false;

    (async () => {
      try {
        const profile = await fetchMyProfileCached();
        if (cancelled) return;
        const next = getPostAuthRedirectPath(profile);
        if (next !== "/") {
          router.replace(withOnboardingQuery(next));
        }
      } catch {
        // Couldn't load the profile (network blip, etc.) — don't redirect on a guess.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, loading, isLoggedIn]);

  return <>{children}</>;
}
