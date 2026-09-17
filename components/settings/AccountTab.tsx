"use client";

import EmailVerificationBanner from "@/components/home/EmailVerificationBanner";
import type { ProfileResponse } from "@/lib/onboarding";

type AccountTabProps = {
  profile: ProfileResponse | null;
};

export default function AccountTab({ profile }: AccountTabProps) {
  return (
    <div className="space-y-6">
      <EmailVerificationBanner />
      <div className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-zinc-900">Account</h1>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</dt>
            <dd className="mt-0.5 text-zinc-900">{profile?.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</dt>
            <dd className="mt-0.5 text-zinc-900">{profile?.phone || "—"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-zinc-500">
          To change the email or phone tied to your account, contact support.
        </p>
      </div>
    </div>
  );
}
