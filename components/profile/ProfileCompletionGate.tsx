"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import { configureAmplifyAuth } from "@/lib/amplify";
import {
  fetchMyProfile,
  getPostAuthRedirectPath,
  shouldSkipProfileGate,
  withOnboardingQuery,
} from "@/lib/onboarding";

export default function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!configureAmplifyAuth()) {
      setAllowed(true);
      return;
    }

    if (shouldSkipProfileGate(pathname)) {
      setAllowed(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await getCurrentUser();
      } catch {
        if (!cancelled) setAllowed(true);
        return;
      }

      try {
        const profile = await fetchMyProfile();
        if (cancelled) return;
        const next = getPostAuthRedirectPath(profile);
        if (next !== "/") {
          router.replace(withOnboardingQuery(next));
          return;
        }
        if (!cancelled) setAllowed(true);
      } catch {
        if (!cancelled) setAllowed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
        <p className="text-sm text-zinc-600">Checking your profile…</p>
      </div>
    );
  }

  return <>{children}</>;
}
