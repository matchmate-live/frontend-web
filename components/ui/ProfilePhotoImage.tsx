"use client";

import Image, { type ImageLoader, type ImageProps } from "next/image";
import { useState } from "react";
import { hasThumbnail, PHOTO_THUMB_MAX_PX, thumbUrlFor } from "@/lib/profilePhoto";

// Photos load straight from CloudFront, not through Vercel's optimizer. For each size in
// the srcset this picks the thumbnail (up to 400px) or the full photo.
const photoLoader: ImageLoader = ({ src, width }) => (width <= PHOTO_THUMB_MAX_PX ? thumbUrlFor(src) : src);

type ProfilePhotoImageProps = Omit<ImageProps, "src" | "loader" | "unoptimized"> & {
  /** Photo URL from profilePhotoSrc(), or the placeholder. */
  src: string;
};

// Use this instead of next/image for profile photos.
export default function ProfilePhotoImage({ src, alt, onError, ...props }: ProfilePhotoImageProps) {
  // Older photos have no thumbnail; if it fails to load, show the full photo instead.
  const [thumbFailedFor, setThumbFailedFor] = useState<string | null>(null);
  const useThumbs = hasThumbnail(src) && thumbFailedFor !== src;

  return (
    <Image
      {...props}
      alt={alt}
      src={src}
      {...(useThumbs ? { loader: photoLoader } : { unoptimized: true })}
      onError={(e) => {
        if (useThumbs) setThumbFailedFor(src);
        onError?.(e);
      }}
    />
  );
}
