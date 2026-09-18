"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { profilePhotoSrc } from "@/lib/profilePhoto";

type ProfilePhotoCarouselProps = {
  photos: string[] | undefined;
  name: string;
};

export default function ProfilePhotoCarousel({ photos, name }: ProfilePhotoCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  // No photos → one slide showing the placeholder, same as before this had a carousel.
  const items = photos && photos.length > 0 ? photos : [undefined];

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(next, items.length - 1));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  }

  // Scroll-snap drives the actual navigation (native touch swipe on mobile, drag/wheel on
  // desktop) — this just reads position back out to keep the arrows/dots in sync.
  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    setIndex((prev) => (prev === next ? prev : next));
  }

  return (
    <div className="relative w-full shrink-0 bg-pink-50/50 px-4 sm:px-8 h-[calc(100vw-32px)] sm:h-auto">
      <div className="relative mx-auto aspect-square w-full max-w-2xl sm:aspect-[16/10] sm:max-w-none lg:aspect-[21/9] lg:max-h-[min(42vh,520px)]">
        <div
          ref={trackRef}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={handleScroll}
        >
          {items.map((key, i) => (
            <div key={key ?? `placeholder-${i}`} className="relative h-full w-full shrink-0 snap-center">
              <Image
                alt={`${name}'s photo ${i + 1} of ${items.length}`}
                className="object-contain object-center"
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, min(100vw - 560px, 896px)"
                src={profilePhotoSrc(key)}
              />
            </div>
          ))}
        </div>

        {items.length > 1 ? (
          <>
            <button
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={index === 0}
              type="button"
              onClick={() => goTo(index - 1)}
            >
              <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={index === items.length - 1}
              type="button"
              onClick={() => goTo(index + 1)}
            >
              <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {items.map((key, i) => (
                <span
                  key={key ?? `dot-${i}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
