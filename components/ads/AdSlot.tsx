"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  slot: string;
  className: string;
  /**
   * Fixed size, e.g. 250x600. Leave out for a responsive ad, but note AdSense may then
   * override the parent's height (why AdRail uses a fixed size).
   */
  size?: { width: number; height: number };
};

export default function AdSlot({ slot, className, size }: AdSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientId || typeof window === "undefined") return;
    const el = wrapperRef.current;
    if (!el) return;

    // Both mobile and desktop slots are mounted; the hidden one has width 0 and AdSense
    // throws for it. Wait for a real width with ResizeObserver before loading the ad.
    let pushed = false;
    const observer = new ResizeObserver(() => {
      if (pushed || el.offsetWidth <= 0) return;
      pushed = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Ignore duplicate push errors during fast refresh.
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [clientId, slot]);

  const sizeStyle = size ? { width: size.width, height: size.height } : undefined;

  if (!clientId) {
    return <div className={`max-w-full overflow-hidden ${className}`} style={sizeStyle} />;
  }

  return (
    // No data-full-width-responsive, it makes the ad full screen width. "auto" fits the container.
    <div ref={wrapperRef} className="w-full max-w-full overflow-hidden">
      <ins
        className={`adsbygoogle ${className}`}
        data-ad-client={clientId}
        data-ad-slot={slot}
        style={sizeStyle}
        {...(size ? {} : { "data-ad-format": "auto" })}
      />
    </div>
  );
}
