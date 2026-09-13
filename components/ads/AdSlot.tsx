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
    <ins
      className={`adsbygoogle max-w-full overflow-hidden ${className}`}
      data-ad-client={clientId}
      data-ad-format="auto"
      data-ad-slot={slot}
      data-full-width-responsive="true"
    />
  );
}
