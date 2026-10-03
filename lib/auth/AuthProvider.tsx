"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUser, signOut as amplifySignOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { configureAmplifyAuth } from "@/lib/amplify";
import { markHadSession } from "@/lib/auth/sessionFlag";
import { clearMyProfileCache } from "@/lib/onboarding/myProfileCache";
import { resetPresence } from "@/lib/presence";

type AuthContextValue = {
  /** True only while the first sign-in check is running. */
  loading: boolean;
  isLoggedIn: boolean;
  /** Signed-in user's id, or null. Use this to check "is this mine". */
  userId: string | null;
  /** Re-checks now. Rarely needed, sign-in/out already updates everything. */
  refresh: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// The app's sign-in state. Checks once on load, then updates from Amplify's auth events.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // undefined until the first check, so that check doesn't count as an account switch.
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  // Clears per-account data in localStorage (cached profile, presence) when the account
  // changes, so nothing carries over to the next user.
  const onUserResolved = useCallback((next: string | null) => {
    const prev = lastUserIdRef.current;
    lastUserIdRef.current = next;
    if (prev !== undefined && prev !== next) {
      clearMyProfileCache();
      resetPresence();
    }
  }, []);

  const check = useCallback(() => {
    // If config is missing, getCurrentUser() just fails and we treat it as signed out.
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
