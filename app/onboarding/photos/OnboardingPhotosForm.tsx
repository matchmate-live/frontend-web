"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import SkipPhotosDialog from "@/components/onboarding/SkipPhotosDialog";
import { configureAmplifyAuth } from "@/lib/amplify";
import { isSessionExpiredError } from "@/lib/api/authRedirect";
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

type PendingPhoto = { file: File; previewUrl: string };

export default function OnboardingPhotosForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firstVisit = searchParams.get(ONBOARDING_QUERY.firstVisit) === "1";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Picked files, previewed locally — nothing touches S3 until submit (see saveWithPhotos).
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const previewUrlsRef = useRef<Set<string>>(new Set());
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

  // Revoke any preview URLs still outstanding if the form unmounts before submit — read at
  // cleanup time, not captured at setup, to catch whatever's actually outstanding then.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const remaining = MAX_PROFILE_PHOTOS - pendingPhotos.length;
    if (remaining <= 0) {
      setError(`You can upload at most ${MAX_PROFILE_PHOTOS} photos.`);
      return;
    }
    setError("");
    const files = Array.from(fileList).slice(0, remaining);
    const accepted: PendingPhoto[] = [];
    for (const file of files) {
      const pre = validateImageFileBeforeProcessing(file);
      if (pre) {
        setError(pre);
        break;
      }
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      accepted.push({ file, previewUrl });
    }
    if (accepted.length) {
      setPendingPhotos((prev) => [...prev, ...accepted]);
    }
  }

  function removePendingPhoto(index: number) {
    setPendingPhotos((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrlsRef.current.delete(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  // A real 401 already triggered the session-expired toast (see clientError.ts); this
  // just needs to skip the redundant inline error for that one case.
  function handleSaveError(err: unknown, fallbackMessage: string) {
    if (!isSessionExpiredError(err)) {
      setError(err instanceof Error ? err.message : fallbackMessage);
    }
  }

  async function completePhotosPrompt() {
    setSaving(true);
    try {
      await updateMyProfile({ onboardingPhotosPromptCompleted: true });
      router.push("/");
    } catch (err) {
      handleSaveError(err, "Could not continue");
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  }

  async function saveWithPhotos() {
    setSaving(true);
    setError("");
    try {
      // Upload happens here, at confirm time — nothing pending has touched S3 before this.
      const uploadedKeys: string[] = [];
      for (const { file } of pendingPhotos) {
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
        uploadedKeys.push(key);
      }

      // Explicit — the backend only auto-derives this flag on the call where
      // onboardingStatus first becomes "complete" (already happened in the profile step),
      // so this call must say so itself or the user gets bounced back here forever.
      await updateMyProfile({ photos: uploadedKeys, onboardingPhotosPromptCompleted: true });
      router.push("/");
    } catch (err) {
      handleSaveError(err, "Could not save photos");
    } finally {
      setSaving(false);
    }
  }

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pendingPhotos.length > 0) {
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
            disabled={saving || pendingPhotos.length >= MAX_PROFILE_PHOTOS}
            id="photos-input"
            multiple={pendingPhotos.length < MAX_PROFILE_PHOTOS - 1}
            type="file"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {pendingPhotos.length > 0 ? (
          <ul className="space-y-2">
            {pendingPhotos.map((p, i) => (
              <li
                className="flex items-center justify-between gap-3 rounded-lg border border-pink-100 bg-pink-50/30 px-3 py-2 text-sm text-zinc-800"
                key={`pending-${p.previewUrl}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {/* Local blob preview — next/image can't optimize blob: URLs. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`Photo ${i + 1} preview`}
                    className="h-12 w-12 shrink-0 rounded-md bg-pink-50 object-cover"
                    src={p.previewUrl}
                  />
                  <span className="truncate" title={p.file.name}>
                    Photo {i + 1}
                  </span>
                </div>
                <button
                  className="cursor-pointer shrink-0 text-pink-400 underline"
                  type="button"
                  onClick={() => removePendingPhoto(i)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {!(showSkip && pendingPhotos.length === 0) ? (
          <button
            className="w-full cursor-pointer rounded-md bg-pink-300 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving
              ? "Saving…"
              : pendingPhotos.length > 0
                ? "Save and continue"
                : photosStepPending
                  ? "Continue without photos"
                  : "Continue"}
          </button>
        ) : null}
      </form>

      {showSkip ? (
        <button
          className="mt-3 w-full cursor-pointer rounded-md border border-pink-200 bg-white py-2.5 text-sm font-medium text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
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
