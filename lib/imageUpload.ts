export const MAX_PROFILE_PHOTOS = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Longest-edge cap, in px, applied before upload. Profile photos are never displayed
 * wider than this anywhere in the app (the desktop carousel banner tops out well under
 * it), so anything larger is resolution nobody sees — just extra upload time, storage, and
 * CDN transfer cost. */
export const MAX_IMAGE_DIMENSION = 1600;
/** 0.92 (the old default) is well past the point of visible difference for photographic
 * content — 0.8 is the standard "web photo" sweet spot: no perceptible quality loss at
 * normal viewing sizes, but meaningfully smaller files (often 30-50% less than 0.92 for
 * the same image), which is what actually drives S3 storage + CDN transfer cost down. */
const JPEG_QUALITY = 0.8;

/** Ensure JPEG under size cap for Cognito/S3 presign (image/jpeg), downscaled to MAX_IMAGE_DIMENSION. */
export async function fileToJpegBlob(file: File): Promise<Blob> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Each image must be 5 MB or smaller.");
  }
  const img = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  // Already JPEG and no resize needed — nothing to gain from re-encoding.
  if (file.type === "image/jpeg" && scale === 1) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process this image.");
  }
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) {
    throw new Error("Could not convert image to JPEG.");
  }
  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is still larger than 5 MB after compression. Try a smaller photo.");
  }
  return blob;
}
