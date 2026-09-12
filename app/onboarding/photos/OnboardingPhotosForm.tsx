"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import SkipPhotosDialog from "@/components/onboarding/SkipPhotosDialog";
import { configureAmplifyAuth } from "@/lib/amplify";
import { fileToJpegBlob, MAX_PROFILE_PHOTOS } from "@/lib/imageUpload";
import {
  fetchMyProfile,
  getRedirectFromPhotosStep,
  ONBOARDING_QUERY,
  ONBOARDING_ROUTES,
  presignUpload,
  updateMyProfile,
  validateImageFileBeforeProcessing,
  type ProfileResponse,
} from "@/lib/onboarding";

export default function OnboardingPhotosForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firstVisit = searchParams.get(ONBOARDING_QUERY.firstVisit) === "1";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [keys, setKeys] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const photosStepPending = profile?.onboardingPhotosPromptCompleted === false;

  useEffect(() => {
    if (!configureAmplifyAuth()) {
      router.replace(`/auth/sign-in?next=${encodeURIComponent(ONBOARDING_ROUTES.photos)}`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await getCurrentUser();
      } catch {
        router.replace(`/auth/sign-in?next=${encodeURIComponent(ONBOARDING_ROUTES.photos)}`);
        return;
      }
      try {
        const p = await fetchMyProfile();
        if (cancelled) return;
        if (!p) {
          router.replace(`/auth/sign-in?next=${encodeURIComponent(ONBOARDING_ROUTES.photos)}`);
          return;
        }
        setProfile(p);
        const redirect = getRedirectFromPhotosStep(p);
        if (redirect) {
          router.replace(redirect);
          return;
        }
        if (Array.isArray(p.photos) && p.photos.length > 0) {
          setKeys(p.photos.slice(0, MAX_PROFILE_PHOTOS));
        }
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

  async function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const remaining = MAX_PROFILE_PHOTOS - keys.length;
    if (remaining <= 0) {
      setError(`You can upload at most ${MAX_PROFILE_PHOTOS} photos.`);
      return;
    }
    setError("");
    const files = Array.from(fileList).slice(0, remaining);
    setUploading(true);
    try {
      const nextKeys = [...keys];
      for (const file of files) {
        const pre = validateImageFileBeforeProcessing(file);
        if (pre) throw new Error(pre);
        const jpeg = await fileToJpegBlob(file);
        const { uploadUrl, key } = await presignUpload();
        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: jpeg,
        });
        if (!put.ok) {
          throw new Error("Upload failed. Try again.");
        }
        nextKeys.push(key);
      }
      setKeys(nextKeys);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeAt(index: number) {
    setKeys((prev) => prev.filter((_, i) => i !== index));
  }

  async function completePhotosPrompt() {
    setSaving(true);
    try {
      await updateMyProfile({ onboardingPhotosPromptCompleted: true });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue");
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  }

  async function saveWithPhotos() {
    setSaving(true);
    try {
      await updateMyProfile({ photos: keys });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save photos");
    } finally {
      setSaving(false);
    }
  }

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (keys.length > 0) {
      await saveWithPhotos();
      return;
    }
    if (photosStepPending && !firstVisit) {
      setConfirmOpen(true);
      return;
    }
    if (!photosStepPending) {
      await completePhotosPrompt();
    }
  }

  if (loading || !profile) {
    return (
      <div className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">Loading…</p>
      </div>
    );
  }

  const showSkip = photosStepPending && firstVisit;

  return (
    <article className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm sm:p-8">
      <header>
        <p className="text-sm font-medium text-pink-300">Step 2 of 2</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Profile photos</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Add up to {MAX_PROFILE_PHOTOS} photos (JPEG, max 5 MB each). Photos are optional — you can add them later
          from your profile.
        </p>
      </header>

      {error ? (
        <p className="mt-4 rounded-md bg-red-50 p-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={finish}>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-800" htmlFor="photos-input">
            Upload images
          </label>
          <input
            accept="image/*"
            className="block w-full cursor-pointer text-sm text-zinc-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-pink-200 file:px-3 file:py-2 file:text-zinc-900"
            disabled={uploading || keys.length >= MAX_PROFILE_PHOTOS}
            id="photos-input"
            multiple={keys.length < MAX_PROFILE_PHOTOS - 1}
            type="file"
            onChange={(e) => void addFiles(e.target.files)}
          />
        </div>

        {keys.length > 0 ? (
          <ul className="space-y-2">
            {keys.map((k, i) => (
              <li
                className="flex items-center justify-between gap-2 rounded-lg border border-pink-100 bg-pink-50/30 px-3 py-2 text-sm text-zinc-800"
                key={`${k}-${i}`}
              >
                <span className="truncate" title={k}>
                  Photo {i + 1}
                </span>
                <button
                  className="cursor-pointer shrink-0 text-pink-400 underline"
                  type="button"
                  onClick={() => removeAt(i)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {!(showSkip && keys.length === 0) ? (
          <button
            className="w-full cursor-pointer rounded-md bg-pink-300 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving || uploading}
            type="submit"
          >
            {saving
              ? "Saving…"
              : keys.length > 0
                ? "Save and continue"
                : photosStepPending
                  ? "Continue without photos"
                  : "Continue"}
          </button>
        ) : null}
      </form>

      {showSkip ? (
        <button
          className={`w-full cursor-pointer rounded-md border border-pink-200 bg-white py-2.5 text-sm font-medium text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 ${
            !(showSkip && keys.length === 0) ? "mt-3" : ""
          }`}
          disabled={saving || uploading}
          type="button"
          onClick={() => setConfirmOpen(true)}
        >
          Skip for now
        </button>
      ) : null}

      {photosStepPending && !firstVisit ? (
        <p className="mt-3 text-center text-xs text-zinc-500">
          Complete this step once to use the rest of the site. You can add photos now or continue without them.
        </p>
      ) : null}

      <p className="mt-4 text-center text-sm text-zinc-600">
        <Link className="text-pink-300 underline" href={ONBOARDING_ROUTES.profile}>
          Back to profile
        </Link>
      </p>

      <SkipPhotosDialog
        busy={saving}
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void completePhotosPrompt()}
      />
    </article>
  );
}
