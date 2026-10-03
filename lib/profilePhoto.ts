// Shown when a profile has no photo, or the media URL isn't configured.
export const PROFILE_PLACEHOLDER_PATH = "/images/profile-placeholder.svg";

/**
 * Each photo has a thumbnail up to this size at x.thumb.jpg (same rule as the backend's
 * thumbKeyFor). 400px is enough for the 112px desktop card on 3x screens.
 */
export const PHOTO_THUMB_MAX_PX = 400;

export function thumbUrlFor(photoUrl: string): string {
  return photoUrl.replace(/\.jpg$/i, ".thumb.jpg");
}

// True for uploaded photos, false for the placeholder.
export function hasThumbnail(src: string): boolean {
  return /^https?:\/\//.test(src) && /\.jpg$/i.test(src);
}

function profileMediaBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PROFILE_MEDIA_BASE_URL?.trim().replace(/\/$/, "") ?? "";
}

// Public URL for a photo key. Falls back to the placeholder if the media URL isn't set.
export function profilePhotoSrc(firstPhotoKey: string | undefined): string {
  const key = firstPhotoKey?.trim();
  if (!key) return PROFILE_PLACEHOLDER_PATH;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  const base = profileMediaBaseUrl();
  if (!base) return PROFILE_PLACEHOLDER_PATH;
  return `${base}/${key.replace(/^\//, "")}`;
}
