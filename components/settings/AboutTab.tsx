"use client";

import { useState } from "react";
import ProfileDetailsFields from "@/components/profile/ProfileDetailsFields";
import { isSessionExpiredError } from "@/lib/api/authRedirect";
import { updateMyProfile, type ProfileResponse } from "@/lib/onboarding";
import {
  profileDetailsFromProfile,
  profileDetailsToPayload,
  validateProfileDetails,
  type ProfileDetailsErrors,
} from "@/lib/profileDetails";

type AboutTabProps = {
  profile: ProfileResponse | null;
  onSaved: (updated: ProfileResponse) => void;
};

// About-me details. Separate from ProfileTab so each saves on its own.
export default function AboutTab({ profile, onSaved }: AboutTabProps) {
  const [details, setDetails] = useState(() => profileDetailsFromProfile(profile));
  const [detailErrors, setDetailErrors] = useState<ProfileDetailsErrors>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Compare the cleaned-up values so things like extra spaces don't count as changes.
  const isDirty =
    JSON.stringify(profileDetailsToPayload(details)) !==
    JSON.stringify(profileDetailsToPayload(profileDetailsFromProfile(profile)));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    const nextDetailErrors = validateProfileDetails(details);
    setDetailErrors(nextDetailErrors);
    if (Object.keys(nextDetailErrors).length > 0) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await updateMyProfile(profileDetailsToPayload(details));
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      if (!isSessionExpiredError(err)) {
        setError(err instanceof Error ? err.message : "Could not save your details.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-semibold text-zinc-900">About me</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Let people get to know the real you — share what you love and who you&apos;re hoping to meet.
      </p>

      {error ? (
        <p className="mt-4 rounded-md bg-red-50 p-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="mt-4 rounded-md bg-emerald-50 p-2 text-sm text-emerald-800" role="status">
          Saved.
        </p>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <ProfileDetailsFields
          errors={detailErrors}
          idPrefix="settings-about"
          value={details}
          onChange={(next) => {
            setDetails(next);
            setDetailErrors({});
          }}
        />

        <button
          className="w-full cursor-pointer rounded-md bg-pink-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 sm:w-auto sm:px-6"
          disabled={saving || !isDirty}
          type="submit"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
