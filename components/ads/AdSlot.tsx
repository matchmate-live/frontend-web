"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  slot: string;
  className: string;
};

export default function AdSlot({ slot, className }: AdSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();

  useEffect(() => {
    if (!clientId || typeof window === "undefined") return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore duplicate push errors during fast refresh.
    }
  }, [clientId, slot]);

  if (!clientId) {
    return <div className={`max-w-full overflow-hidden ${className}`} />;
  }

  return (
    // No data-full-width-responsive: that flag makes AdSense deliberately size the ad to the
    // full device viewport width (via a negative margin + explicit width), breaking out of
    // whatever padded container it's in — by design, not a bug. Plain data-ad-format="auto"
    // sizes responsively to this element's own container instead, which is what we want here.
    // The overflow-hidden wrapper stays as a safety net for anything AdSense still oversizes.
    <div className="w-full max-w-full overflow-hidden">
      <ins
        className={`adsbygoogle ${className}`}
        data-ad-client={clientId}
        data-ad-format="auto"
        data-ad-slot={slot}
      />
    </div>
  );
}
