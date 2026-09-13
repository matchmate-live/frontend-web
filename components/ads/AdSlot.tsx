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
   * Fixed pixel size (e.g. a 250x600 skyscraper). Omit for a responsive "auto"-format ad
   * that sizes to its container — but note AdSense's auto/responsive format will forcibly
   * override ancestor height/min-height with inline !important styles if its chosen ad
   * creative doesn't match the space given to it (see AdRail, which needs a fixed size
   * specifically to stop that from happening to the sticky sidebar layout).
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

    // Mobile and desktop ad slots are both mounted at once (Tailwind's lg:hidden /
    // hidden lg:block only toggle CSS display, not the DOM), so whichever one is hidden
    // for the current viewport has width 0 — pushing then throws "No slot size for
    // availableWidth=0". A synchronous offsetWidth read inside this effect isn't reliable
    // here since React's commit phase isn't guaranteed to run after the browser has
    // finished layout (CSS can still be settling, particularly in dev). ResizeObserver's
    // callback is spec-guaranteed to fire only once layout is actually computed, so it's
    // used for the very first measurement too, not just later visibility changes.
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
    // No data-full-width-responsive: that flag makes AdSense deliberately size the ad to the
    // full device viewport width (via a negative margin + explicit width), breaking out of
    // whatever padded container it's in — by design, not a bug. Plain data-ad-format="auto"
    // (only used when no fixed `size` is given) sizes responsively to this element's own
    // container instead. The overflow-hidden wrapper stays as a safety net for anything
    // AdSense still oversizes.
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
