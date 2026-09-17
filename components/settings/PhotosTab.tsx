"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { isSessionExpiredError } from "@/lib/api/authRedirect";
import { fileToJpegBlob, MAX_PROFILE_PHOTOS } from "@/lib/imageUpload";
import { profilePhotoSrc } from "@/lib/profilePhoto";
import {
  deleteUploadedPhoto,
  presignUpload,
  updateMyProfile,
  validateImageFileBeforeProcessing,
  type ProfileResponse,
} from "@/lib/onboarding";

type PendingPhoto = { file: File; previewUrl: string };

type PhotosTabProps = {
  profile: ProfileResponse | null;
  onSaved: (updated: ProfileResponse) => void;
};

export default function PhotosTab({ profile, onSaved }: PhotosTabProps) {
  const [existingPhotos, setExistingPhotos] = useState<string[]>(profile?.photos ?? []);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Revoke any preview URLs still outstanding if the tab unmounts before saving.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const totalPhotoCount = existingPhotos.length + pendingPhotos.length;
  const originalPhotos = profile?.photos ?? [];
  const isDirty =
    pendingPhotos.length > 0 ||
    existingPhotos.length !== originalPhotos.length ||
    existingPhotos.some((key, i) => key !== originalPhotos[i]);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const remaining = MAX_PROFILE_PHOTOS - totalPhotoCount;
    if (remaining <= 0) {
      setError(`You can have at most ${MAX_PROFILE_PHOTOS} photos.`);
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
    if (accepted.length) setPendingPhotos((prev) => [...prev, ...accepted]);
  }

  function removeExistingPhoto(key: string) {
    setExistingPhotos((prev) => prev.filter((k) => k !== key));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    setSaving(true);
    setError("");
    setSaved(false);
    const removedKeys = (profile?.photos ?? []).filter((k) => !existingPhotos.includes(k));
    try {
      const uploadedKeys: string[] = [];
      for (const { file } of pendingPhotos) {
        const jpeg = await fileToJpegBlob(file);
        const { uploadUrl, key } = await presignUpload();
        const put = await fetch(uploadUrl, {
          method: "PUT",
          // Must match exactly what the presigned URL signed (see presignMedia's
          // ServerSideEncryption: 'AES256') — S3 rejects the request with a signature
          // mismatch otherwise, since this header is part of what was signed.
          headers: { "Content-Type": "image/jpeg", "x-amz-server-side-encryption": "AES256" },
          body: jpeg,
        });
        if (!put.ok) throw new Error("Photo upload failed. Try again.");
        uploadedKeys.push(key);
      }

      const finalPhotos = [...existingPhotos, ...uploadedKeys];
      const updated = await updateMyProfile({ photos: finalPhotos });
      onSaved(updated);
      setExistingPhotos(updated.photos ?? finalPhotos);
      pendingPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      previewUrlsRef.current.clear();
      setPendingPhotos([]);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);

      // Best-effort cleanup — the profile no longer references these, so it's safe to
      // remove them now; a failure here doesn't affect what was already saved.
      for (const key of removedKeys) {
        deleteUploadedPhoto(key).catch(() => {});
      }
    } catch (err) {
      if (!isSessionExpiredError(err)) {
        setError(err instanceof Error ? err.message : "Could not save your photos.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-semibold text-zinc-900">Photos</h1>
      <p className="mt-1 text-sm text-zinc-600">Add up to {MAX_PROFILE_PHOTOS} photos (JPEG, max 5 MB each).</p>

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
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-600">
            Photos ({totalPhotoCount}/{MAX_PROFILE_PHOTOS})
          </p>
          {totalPhotoCount > 0 ? (
            <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {existingPhotos.map((key) => (
                <li key={key} className="relative aspect-square overflow-hidden rounded-lg bg-pink-50">
                  <Image alt="Your photo" className="object-cover" fill sizes="120px" src={profilePhotoSrc(key)} />
                  <button
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 cursor-pointer rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white"
                    type="button"
                    onClick={() => removeExistingPhoto(key)}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {pendingPhotos.map((p, i) => (
                <li key={p.previewUrl} className="relative aspect-square overflow-hidden rounded-lg bg-pink-50">
                  {/* Local blob preview — next/image can't optimize blob: URLs. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="New photo" className="h-full w-full object-cover" src={p.previewUrl} />
                  <button
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 cursor-pointer rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white"
                    type="button"
                    onClick={() => removePendingPhoto(i)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <input
            accept="image/*"
            className="block w-full cursor-pointer text-sm text-zinc-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-pink-200 file:px-3 file:py-2 file:text-zinc-900"
            disabled={totalPhotoCount >= MAX_PROFILE_PHOTOS}
            multiple
            type="file"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <button
          className="w-full cursor-pointer rounded-md bg-pink-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 sm:w-auto sm:px-6"
          disabled={saving || !isDirty}
          type="submit"
        >
          {saving ? "Saving…" : "Save photos"}
        </button>
      </form>
    </div>
  );
}
