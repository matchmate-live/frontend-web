"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import FloatingInput from "@/components/ui/FloatingInput";
import { configureAmplifyAuth } from "@/lib/amplify";
import { redirectIfSessionExpired } from "@/lib/api/authRedirect";
import { getCountryOptions, getCityOptionsByCountry } from "@/lib/geoData";
import { titleCase } from "@/lib/location";
import {
  fetchMyProfile,
  getRedirectFromProfileStep,
  maxIsoDobForMinAgeUtc,
  minIsoDobForMaxAgeUtc,
  ONBOARDING_ROUTES,
  MAX_PROFILE_AGE,
  MIN_PROFILE_AGE,
  updateMyProfile,
  validateOnboardingProfileFieldsDetailed,
  withOnboardingQuery,
  type OnboardingProfileInput,
} from "@/lib/onboarding";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [genderPreference, setGenderPreference] = useState<"male" | "female" | "">("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof OnboardingProfileInput, string>>>({});

  const countries = useMemo(() => getCountryOptions(), []);
  const cities = useMemo(() => getCityOptionsByCountry(country), [country]);
  const dobBounds = useMemo(
    () => ({
      min: minIsoDobForMaxAgeUtc(MAX_PROFILE_AGE),
      max: maxIsoDobForMinAgeUtc(MIN_PROFILE_AGE),
    }),
    [],
  );

  useEffect(() => {
    if (!configureAmplifyAuth()) {
      router.replace(`/auth/sign-in?next=${encodeURIComponent(ONBOARDING_ROUTES.profile)}`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await getCurrentUser();
      } catch {
        router.replace(`/auth/sign-in?next=${encodeURIComponent(ONBOARDING_ROUTES.profile)}`);
        return;
      }
      try {
        const p = await fetchMyProfile();
        if (cancelled) return;
        if (!p) {
          router.replace(`/auth/sign-in?next=${encodeURIComponent(ONBOARDING_ROUTES.profile)}`);
          return;
        }
        const redirect = getRedirectFromProfileStep(p);
        if (redirect) {
          router.replace(redirect);
          return;
        }
        setName(p.name ?? "");
        setDescription(p.description ?? "");
        setDob(p.dob ?? "");
        setCountry(p.country ?? "");
        setCity(p.city ?? "");
        setGender(p.gender === "male" || p.gender === "female" ? p.gender : "");
        setGenderPreference(
          p.genderPreference === "male" || p.genderPreference === "female" ? p.genderPreference : "",
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input: OnboardingProfileInput = {
      name,
      dob,
      country,
      city,
      gender,
      genderPreference,
    };
    const { ok, errors } = validateOnboardingProfileFieldsDetailed(input);
    setFieldErrors(errors);
    if (!ok) return;

    setSaving(true);
    try {
      await updateMyProfile({
        name: name.trim(),
        description: description.trim() || undefined,
        dob,
        country,
        city,
        gender,
        genderPreference,
      });
      router.push(withOnboardingQuery(ONBOARDING_ROUTES.photos));
    } catch (err) {
      if (!redirectIfSessionExpired(err, router, pathname)) {
        setError(err instanceof Error ? err.message : "Could not save profile");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">Loading…</p>
      </div>
    );
  }

  return (
    <article className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm sm:p-8">
      <header>
        <p className="text-sm font-medium text-pink-300">Step 1 of 2</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Your profile</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Tell others a bit about you. You can update this later in settings.
        </p>
      </header>

      {error ? (
        <p className="mt-4 rounded-md bg-red-50 p-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <FloatingInput
          error={fieldErrors.name}
          label="Display name"
          required
          type="text"
          value={name}
          onChange={(v) => {
            setName(v);
            setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }}
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600" htmlFor="about-you">
            About you (optional)
          </label>
          <textarea
            className="min-h-[88px] w-full rounded-lg border border-zinc-800 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-pink-300"
            id="about-you"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <FloatingInput
          error={fieldErrors.dob}
          label="Date of birth"
          max={dobBounds.max}
          min={dobBounds.min}
          required
          type="date"
          value={dob}
          onChange={(v) => {
            setDob(v);
            setFieldErrors((prev) => ({ ...prev, dob: undefined }));
          }}
        />
        <p className="text-xs text-zinc-500">
          You must be at least {MIN_PROFILE_AGE} years old (and at most {MAX_PROFILE_AGE}).
        </p>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600" htmlFor="country">
            Country
          </label>
          <select
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-pink-300 ${
              fieldErrors.country ? "border-red-400" : "border-zinc-800"
            }`}
            id="country"
            required
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setCity("");
              setFieldErrors((prev) => ({ ...prev, country: undefined }));
            }}
          >
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c.isoCode} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {fieldErrors.country ? <p className="mt-1 text-xs text-red-600">{fieldErrors.country}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600" htmlFor="city">
            City
          </label>
          <select
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-pink-300 ${
              fieldErrors.city ? "border-red-400" : "border-zinc-800"
            }`}
            disabled={!country}
            id="city"
            required
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setFieldErrors((prev) => ({ ...prev, city: undefined }));
            }}
          >
            <option value="">{country ? "Select city" : "Select country first"}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {titleCase(c)}
              </option>
            ))}
          </select>
          {fieldErrors.city ? <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600" htmlFor="gender">
            Your gender
          </label>
          <select
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-pink-300 ${
              fieldErrors.gender ? "border-red-400" : "border-zinc-800"
            }`}
            id="gender"
            required
            value={gender}
            onChange={(e) => {
              setGender(e.target.value as "male" | "female");
              setFieldErrors((prev) => ({ ...prev, gender: undefined }));
            }}
          >
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          {fieldErrors.gender ? <p className="mt-1 text-xs text-red-600">{fieldErrors.gender}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600" htmlFor="pref">
            Interested in meeting
          </label>
          <select
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-pink-300 ${
              fieldErrors.genderPreference ? "border-red-400" : "border-zinc-800"
            }`}
            id="pref"
            required
            value={genderPreference}
            onChange={(e) => {
              setGenderPreference(e.target.value as "male" | "female");
              setFieldErrors((prev) => ({ ...prev, genderPreference: undefined }));
            }}
          >
            <option value="">Select</option>
            <option value="female">Women</option>
            <option value="male">Men</option>
          </select>
          {fieldErrors.genderPreference ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.genderPreference}</p>
          ) : null}
        </div>
        <button
          className="w-full cursor-pointer rounded-md bg-pink-300 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving…" : "Continue to photos"}
        </button>
      </form>
    </article>
  );
}
