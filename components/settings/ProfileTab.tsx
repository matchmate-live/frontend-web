"use client";

import { useState } from "react";
import FloatingInput from "@/components/ui/FloatingInput";
import { isSessionExpiredError } from "@/lib/api/authRedirect";
import SelectChevron from "@/components/ui/SelectChevron";
import { titleCase } from "@/lib/location";
import { updateMyProfile, type ProfileResponse } from "@/lib/onboarding";

type ProfileTabProps = {
  profile: ProfileResponse | null;
  onSaved: (updated: ProfileResponse) => void;
};

type GenderPreference = "male" | "female" | "";

function asGenderPreference(value: string | undefined): GenderPreference {
  return value === "male" || value === "female" ? value : "";
}

function LockAdornment() {
  return (
    <span title="Can't be changed once set">
      <svg aria-hidden className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect height="9" rx="2" strokeLinecap="round" strokeLinejoin="round" width="14" x="5" y="11" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function ProfileTab({ profile, onSaved }: ProfileTabProps) {
  const [name, setName] = useState(profile?.name ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [genderPreference, setGenderPreference] = useState<GenderPreference>(
    asGenderPreference(profile?.genderPreference),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const isDirty =
    name.trim() !== (profile?.name ?? "").trim() ||
    description.trim() !== (profile?.description ?? "").trim() ||
    genderPreference !== asGenderPreference(profile?.genderPreference);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    if (!name.trim()) {
      setError("Display name is required.");
      return;
    }
    if (!genderPreference) {
      setError("Please choose who you're interested in meeting.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await updateMyProfile({
        name: name.trim(),
        description: description.trim() || undefined,
        genderPreference,
      });
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      if (!isSessionExpiredError(err)) {
        setError(err instanceof Error ? err.message : "Could not save your profile.");
      }
    } finally {
      setSaving(false);
    }
  }

  const age = profile?.age;
  const gender = profile?.gender?.trim() ? titleCase(profile.gender) : "—";
  const country = profile?.country?.trim() ? titleCase(profile.country) : "—";
  const city = profile?.city?.trim() ? titleCase(profile.city) : "—";

  return (
    <div className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-semibold text-zinc-900">Profile settings</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Update your display name, bio, and who you&apos;re interested in meeting. Date of birth,
        country, city, and gender can&apos;t be changed once set.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-pink-100 pt-5 sm:grid-cols-4">
        <FloatingInput disabled endAdornment={<LockAdornment />} label="Age" value={age != null ? String(age) : "—"} onChange={() => {}} />
        <FloatingInput disabled endAdornment={<LockAdornment />} label="Gender" value={gender} onChange={() => {}} />
        <FloatingInput disabled endAdornment={<LockAdornment />} label="Country" value={country} onChange={() => {}} />
        <FloatingInput disabled endAdornment={<LockAdornment />} label="City" value={city} onChange={() => {}} />
      </div>

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
        <FloatingInput label="Display name" required value={name} onChange={setName} />
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600" htmlFor="settings-about">
            About you (optional)
          </label>
          <textarea
            className="min-h-[88px] w-full rounded-lg border border-zinc-800 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-pink-300"
            id="settings-about"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600" htmlFor="settings-gender-pref">
            Interested in meeting
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-lg border border-zinc-800 bg-white py-2.5 pl-3 pr-9 text-sm text-zinc-900 outline-none focus:border-pink-300"
              id="settings-gender-pref"
              required
              value={genderPreference}
              onChange={(e) => setGenderPreference(e.target.value as GenderPreference)}
            >
              <option value="">Select</option>
              <option value="female">Women</option>
              <option value="male">Men</option>
            </select>
            <SelectChevron />
          </div>
        </div>

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
