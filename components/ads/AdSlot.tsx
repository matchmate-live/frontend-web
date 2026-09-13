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
    // AdSense's script can set an inline width (often with !important) directly on the <ins>,
    // which would override any width/overflow classes placed on that same element. Clipping
    // has to happen on this wrapper instead, since overflow-hidden only contains a child that's
    // wider than it — it can't do anything if the element carrying the class is itself the one
    // that's too wide.
    <div className="w-full max-w-full overflow-hidden">
      <ins
        className={`adsbygoogle ${className}`}
        data-ad-client={clientId}
        data-ad-format="auto"
        data-ad-slot={slot}
        data-full-width-responsive="true"
      />
    </div>
  );
}
