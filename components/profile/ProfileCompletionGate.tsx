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

// Renders right away and redirects in the background if needed, so pages don't wait on it.
export default function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, isLoggedIn } = useAuth();

  useEffect(() => {
    if (loading) return; // wait for the auth check
    if (!isLoggedIn) return; // signed out, nothing to check
    if (shouldSkipProfileGate(pathname)) return;
    // Filters in the home URL mean a search already ran, so the profile was already checked.
    // Reads window.location rather than useSearchParams() to avoid a Suspense boundary on
    // every page.
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
        // Couldn't load the profile, so don't redirect on a guess.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, loading, isLoggedIn]);

  return <>{children}</>;
}
