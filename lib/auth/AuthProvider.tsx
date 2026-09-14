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

  const check = useCallback(() => {
    // configureAmplifyAuth() itself never touches React state; if it fails (env missing),
    // getCurrentUser() below simply rejects and the .catch() below reports "not logged in" —
    // no separate synchronous branch needed.
    configureAmplifyAuth();
    getCurrentUser()
      .then(() => {
        setIsLoggedIn(true);
        markHadSession(true);
      })
      .catch(() => {
        setIsLoggedIn(false);
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
    markHadSession(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ loading, isLoggedIn, refresh: check, signOut }),
    [loading, isLoggedIn, check, signOut],
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
