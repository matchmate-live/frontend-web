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
   * — but AdSense's auto format will forcibly override ancestor height/min-height with
   * inline !important styles if the chosen creative doesn't fit (see AdRail, which needs
   * a fixed size to avoid that in a sticky sidebar).
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

    // Mobile/desktop slots are both mounted at once (Tailwind only toggles CSS display),
    // so the hidden one has width 0 — pushing then throws "No slot size for
    // availableWidth=0". A synchronous offsetWidth read here isn't reliable since layout
    // may still be settling; ResizeObserver only fires once layout is actually computed.
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
    // No data-full-width-responsive: that flag sizes the ad to the full viewport width
    // (by design), breaking out of its container. Plain data-ad-format="auto" sizes to
    // this element's own container instead; overflow-hidden is a safety net either way.
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
