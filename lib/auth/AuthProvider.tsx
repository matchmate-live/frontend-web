"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, signOut as amplifySignOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { configureAmplifyAuth } from "@/lib/amplify";
import { markHadSession } from "@/lib/auth/sessionFlag";

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

  const check = useCallback(() => {
    // If this fails (env missing), getCurrentUser() below just rejects into "not logged in".
    configureAmplifyAuth();
    getCurrentUser()
      .then((u) => {
        setIsLoggedIn(true);
        setUserId(u.userId);
        markHadSession(true);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setUserId(null);
        markHadSession(false);
      })
      .finally(() => setLoading(false));
  }, []);

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
