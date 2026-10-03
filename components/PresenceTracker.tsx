"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { touchPresence } from "@/lib/presence";

/**
 * Keeps a signed-in user showing as online while they're active: page changes, clicks and
 * key presses call touchPresence(), which only sends every 14 minutes. Idle tabs send
 * nothing, so the user shows as "last seen" 15 minutes after their last action.
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
