import { findPhotoIssue, type PhotoIssue } from "@/lib/photoModeration";
import { deleteUploadedPhoto, fetchMyProfile, presignUpload } from "@/lib/onboarding/profileApi";
import { PHOTO_THUMB_MAX_PX } from "@/lib/profilePhoto";

// Ends "Photo N ..." / "This photo ...". No scores or thresholds, so nobody can tune a
// photo to slip through.
const PHOTO_ISSUE_MESSAGES: Record<PhotoIssue, string> = {
  explicit:
    "appears to contain nudity or sexual content, which isn't allowed. Please remove it and choose another.",
  suggestive:
    "looks too revealing for a profile photo. Please choose one where you're more fully dressed.",
};

export const MAX_PROFILE_PHOTOS = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Max longest edge before upload. Photos are never shown bigger than this, so more pixels
// would only cost upload time and storage.
export const MAX_IMAGE_DIMENSION = 1600;
// 0.8 looks the same as higher settings for photos but makes files 30-50% smaller.
const JPEG_QUALITY = 0.8;

// At 400px this looks fine and keeps thumbnails around 15-30 KB.
const THUMB_JPEG_QUALITY = 0.75;

// Scales the image down to fit maxDimension (never up) and saves it as JPEG.
async function resizeToJpeg(source: Blob, maxDimension: number, quality: number): Promise<Blob> {
  const img = await createImageBitmap(source);
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process this image.");
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) {
    throw new Error("Could not convert image to JPEG.");
  }
  return blob;
}

// Returns a JPEG no bigger than MAX_IMAGE_DIMENSION and under the size limit.
export async function fileToJpegBlob(file: File): Promise<Blob> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Each image must be 5 MB or smaller.");
  }
  // Already a small enough JPEG, use it as-is.
  if (file.type === "image/jpeg") {
    const { width, height } = await createImageBitmap(file);
    if (Math.max(width, height) <= MAX_IMAGE_DIMENSION) return file;
  }
  const blob = await resizeToJpeg(file, MAX_IMAGE_DIMENSION, JPEG_QUALITY);
  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is still larger than 5 MB after compression. Try a smaller photo.");
  }
  return blob;
}

// A photo ready to upload, with its thumbnail.
export type PreparedPhoto = { full: Blob; thumb: Blob };

/**
 * Converts and checks every photo before anything uploads, so a rejected photo stops the
 * whole batch. precedingPhotoCount is how many photos are shown before these, so "Photo N"
 * in the error matches what the user sees.
 */
export async function prepareProfilePhotos(files: File[], precedingPhotoCount = 0): Promise<PreparedPhoto[]> {
  const prepared: PreparedPhoto[] = [];
  for (const [i, file] of files.entries()) {
    const full = await fileToJpegBlob(file);
    const issue = await findPhotoIssue(full);
    if (issue) {
      const which =
        files.length + precedingPhotoCount > 1 ? `Photo ${precedingPhotoCount + i + 1}` : "This photo";
      throw new Error(`${which} ${PHOTO_ISSUE_MESSAGES[issue]}`);
    }
    const thumb = await resizeToJpeg(full, PHOTO_THUMB_MAX_PX, THUMB_JPEG_QUALITY);
    prepared.push({ full, thumb });
  }
  return prepared;
}

// Must match what presignMedia signed, or S3 rejects the upload.
const UPLOAD_HEADERS = {
  "Content-Type": "image/jpeg",
  "x-amz-server-side-encryption": "AES256",
  "Cache-Control": "public, max-age=31536000, immutable",
};

// Uploads a photo and its thumbnail. Returns the photo key to save on the profile.
export async function uploadProfilePhoto(photo: PreparedPhoto): Promise<string> {
  const { uploadUrl, key, thumbUploadUrl } = await presignUpload();
  const [put, thumbPut] = await Promise.all([
    fetch(uploadUrl, { method: "PUT", headers: UPLOAD_HEADERS, body: photo.full }),
    // Older backend without thumbnails (e.g. mid-deploy), skip it.
    thumbUploadUrl
      ? fetch(thumbUploadUrl, { method: "PUT", headers: UPLOAD_HEADERS, body: photo.thumb })
      : null,
  ]);
  // Without a thumbnail the full photo is shown instead, so only the main upload must succeed.
  if (!put.ok) throw new Error("Photo upload failed. Try again.");
  if (thumbPut && !thumbPut.ok) console.warn("Thumbnail upload failed; the full photo will be used instead.");
  return key;
}

/**
 * Cleans up photos uploaded for a save that then failed, so they don't sit in S3 unused.
 * Re-reads the profile first and only deletes photos it doesn't use: the save may have
 * worked on the server even though we got an error. If the profile can't be read, nothing
 * is deleted. Best effort, never throws.
 */
export async function discardUnsavedPhotos(uploadedKeys: string[]): Promise<void> {
  if (uploadedKeys.length === 0) return;
  try {
    const profile = await fetchMyProfile();
    const referenced = new Set(profile?.photos ?? []);
    await Promise.all(
      uploadedKeys.filter((key) => !referenced.has(key)).map((key) => deleteUploadedPhoto(key).catch(() => {})),
    );
  } catch {
    // Can't tell what the profile uses, so leave the files alone.
  }
}
