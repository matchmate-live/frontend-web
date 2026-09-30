"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import ProfileDetailsFields from "@/components/profile/ProfileDetailsFields";
import { configureAmplifyAuth } from "@/lib/amplify";
import { isSessionExpiredError } from "@/lib/api/authRedirect";
import {
  fetchMyProfile,
  getRedirectFromAboutStep,
  ONBOARDING_ROUTES,
  updateMyProfile,
  withOnboardingQuery,
} from "@/lib/onboarding";
import {
  profileDetailsFromProfile,
  profileDetailsToPayload,
  validateProfileDetails,
  type ProfileDetailsErrors,
} from "@/lib/profileDetails";

export default function OnboardingAboutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(() => profileDetailsFromProfile(null));
  const [initialPayload, setInitialPayload] = useState("");
  const [detailErrors, setDetailErrors] = useState<ProfileDetailsErrors>({});

  useEffect(() => {
    if (!configureAmplifyAuth()) {
      router.replace(`/auth/sign-in?next=${encodeURIComponent(ONBOARDING_ROUTES.about)}`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await getCurrentUser();
      } catch {
        router.replace(`/auth/sign-in?next=${encodeURIComponent(ONBOARDING_ROUTES.about)}`);
        return;
      }
      try {
        const p = await fetchMyProfile();
        if (cancelled) return;
        if (!p) {
          router.replace(`/auth/sign-in?next=${encodeURIComponent(ONBOARDING_ROUTES.about)}`);
          return;
        }
        const redirect = getRedirectFromAboutStep(p);
        if (redirect) {
          router.replace(redirect);
          return;
        }
        const loaded = profileDetailsFromProfile(p);
        setDetails(loaded);
        setInitialPayload(JSON.stringify(profileDetailsToPayload(loaded)));
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

  function goToPhotos() {
    router.push(withOnboardingQuery(ONBOARDING_ROUTES.photos));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const nextDetailErrors = validateProfileDetails(details);
    setDetailErrors(nextDetailErrors);
    if (Object.keys(nextDetailErrors).length > 0) return;

    const payload = profileDetailsToPayload(details);
    // Nothing changed (e.g. came back to this step, or left it all blank) — no write needed.
    if (JSON.stringify(payload) === initialPayload) {
      goToPhotos();
      return;
    }

    setSaving(true);
    try {
      await updateMyProfile(payload);
      goToPhotos();
    } catch (err) {
      if (!isSessionExpiredError(err)) {
        setError(err instanceof Error ? err.message : "Could not save your details");
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
        <p className="text-sm font-medium text-pink-300">Step 2 of 3</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">A little more about you</h1>
        <p className="mt-2 text-sm text-zinc-600">
          All optional — share as much or as little as you like. You can change these anytime in settings.
        </p>
      </header>

      {error ? (
        <p className="mt-4 rounded-md bg-red-50 p-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <ProfileDetailsFields
          errors={detailErrors}
          idPrefix="onboarding-about"
          value={details}
          onChange={(next) => {
            setDetails(next);
            setDetailErrors({});
          }}
        />
        <button
          className="w-full cursor-pointer rounded-md bg-pink-300 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </form>

      <button
        className="mt-3 w-full cursor-pointer rounded-md border border-pink-200 bg-white py-2.5 text-sm font-medium text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        type="button"
        onClick={goToPhotos}
      >
        Skip for now
      </button>
    </article>
  );
}
