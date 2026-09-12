"use client";

import { useSearchParams } from "next/navigation";
import { ONBOARDING_QUERY } from "@/lib/onboarding";

export default function CompleteProfileBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get(ONBOARDING_QUERY.completeProfile) !== "1") {
    return null;
  }

  return (
    <div
      className="mb-4 rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm"
      role="status"
    >
      <p className="font-medium text-zinc-900">Complete your profile first</p>
      <p className="mt-1 text-zinc-600">
        Finish the steps below so your MatchMate.live account is ready. You will need this before using the rest of
        the site.
      </p>
    </div>
  );
}
