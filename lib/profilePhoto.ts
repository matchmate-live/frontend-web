/**
 * Default avatar when a profile has no photo or media base URL is not configured.
 * Replace this file with your own image at the same path, or use PNG:
 * `public/images/profile-placeholder.png` and update `PROFILE_PLACEHOLDER_PATH` below.
 */
export const PROFILE_PLACEHOLDER_PATH = "/images/profile-placeholder.svg";

function profileMediaBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PROFILE_MEDIA_BASE_URL?.trim().replace(/\/$/, "") ?? "";
}

/**
 * Public URL for a stored photo key (S3/CloudFront). Keys are relative (e.g. `users/.../file.jpg`).
 * If `NEXT_PUBLIC_PROFILE_MEDIA_BASE_URL` is unset, returns the placeholder so the UI never shows a broken key as src.
 */
export function profilePhotoSrc(firstPhotoKey: string | undefined): string {
  const key = firstPhotoKey?.trim();
  if (!key) return PROFILE_PLACEHOLDER_PATH;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  const base = profileMediaBaseUrl();
  if (!base) return PROFILE_PLACEHOLDER_PATH;
  return `${base}/${key.replace(/^\//, "")}`;
}
