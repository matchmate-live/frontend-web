"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { touchPresence } from "@/lib/presence";

/**
 * Keeps a signed-in user's "online" status fresh, driven only by real activity: a route change
 * or any tap/click/keypress. touchPresence() itself sends at most once per 14 minutes (a
 * localStorage check), so these frequent triggers cost nothing in between. An idle tab sends
 * nothing — the user naturally drops to "last seen" 15 minutes after their last action.
 */
export default function PresenceTracker() {
  const { isLoggedIn } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoggedIn) void touchPresence();
  }, [isLoggedIn, pathname]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const onActivity = () => void touchPresence();
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [isLoggedIn]);

  return null;
}
