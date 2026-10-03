"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUser, signOut as amplifySignOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { configureAmplifyAuth } from "@/lib/amplify";
import { markHadSession } from "@/lib/auth/sessionFlag";
import { clearMyProfileCache } from "@/lib/onboarding/myProfileCache";
import { resetPresence } from "@/lib/presence";

type AuthContextValue = {
  /** True once the initial check has resolved (either way) — false only during that first check. */
  loading: boolean;
  isLoggedIn: boolean;
  /** Cognito sub of the signed-in user, or null when signed out. Use this (not a separate
   *  getCurrentUser() call) anywhere "is this my own profile/conversation/etc." matters. */
  userId: string | null;
  /** Re-runs the check now. Rarely needed — sign-in/out anywhere already updates every consumer via Hub. */
  refresh: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Single source of truth for "is anyone signed in" — configures Amplify and calls
 * getCurrentUser() exactly once per app load (not once per component that needs the answer),
 * then stays current via Amplify's Hub auth events instead of every consumer re-polling.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // undefined = not checked yet this page load (so the first check doesn't count as a switch).
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  /** Per-account browser state (cached "my profile", presence timestamp) lives in
   * localStorage — drop it whenever the signed-in account changes, however that happened
   * (sign-in/out here, session expiry, or another tab), so nothing leaks between accounts. */
  const onUserResolved = useCallback((next: string | null) => {
    const prev = lastUserIdRef.current;
    lastUserIdRef.current = next;
    if (prev !== undefined && prev !== next) {
      clearMyProfileCache();
      resetPresence();
    }
  }, []);

  const check = useCallback(() => {
    // If this fails (env missing), getCurrentUser() below just rejects into "not logged in".
    configureAmplifyAuth();
    getCurrentUser()
      .then((u) => {
        onUserResolved(u.userId);
        setIsLoggedIn(true);
        setUserId(u.userId);
        markHadSession(true);
      })
      .catch(() => {
        onUserResolved(null);
        setIsLoggedIn(false);
        setUserId(null);
        markHadSession(false);
      })
      .finally(() => setLoading(false));
  }, [onUserResolved]);

  useEffect(() => {
    check();
    return Hub.listen("auth", ({ payload }) => {
      if (
        payload.event === "signedIn" ||
        payload.event === "signedOut" ||
        payload.event === "tokenRefresh_failure"
      ) {
        check();
      }
    });
  }, [check]);

  const signOut = useCallback(async () => {
    await amplifySignOut();
    clearMyProfileCache();
    resetPresence();
    lastUserIdRef.current = null;
    setIsLoggedIn(false);
    setUserId(null);
    markHadSession(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ loading, isLoggedIn, userId, refresh: check, signOut }),
    [loading, isLoggedIn, userId, check, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
