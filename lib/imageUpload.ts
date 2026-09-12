export const MAX_PROFILE_PHOTOS = 3;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Ensure JPEG under size cap for Cognito/S3 presign (image/jpeg). */
export async function fileToJpegBlob(file: File): Promise<Blob> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Each image must be 5 MB or smaller.");
  }
  if (file.type === "image/jpeg") {
    return file;
  }
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process this image.");
  }
  ctx.drawImage(img, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) {
    throw new Error("Could not convert image to JPEG.");
  }
  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is still larger than 5 MB after compression. Try a smaller photo.");
  }
  return blob;
}
