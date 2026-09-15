"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { setSessionExpiredListener } from "@/lib/api/clientError";

type Toast = {
  id: number;
  message: string;
  actionLabel?: string;
  actionHref?: string;
};

type ToastInput = Omit<Toast, "id">;

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 6000;

/**
 * App-wide snackbar/toast — transient, never navigates on its own. Used in place of
 * redirecting on session expiry: the page stays as it was, with an optional link (e.g.
 * "Sign in") for the visitor to act on if they choose to.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  // Read at call time, not closure-capture time, so the listener always links to whatever
  // page is current when a 401 happens, without re-registering on every navigation.
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useLayoutEffect(() => {
    pathnameRef.current = pathname;
  });

  const showToast = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  // The single app-wide trigger for the session-expired toast — every 401 funnels through
  // clientError.ts, which only calls this after confirming a real prior session and
  // clearing that flag in the same breath, so a burst of failing requests toasts once.
  useEffect(() => {
    setSessionExpiredListener(() => {
      showToast({
        message: "Your session has expired.",
        actionLabel: "Sign in",
        actionHref: `/auth/sign-in?next=${encodeURIComponent(pathnameRef.current)}`,
      });
    });
    return () => setSessionExpiredListener(null);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto w-full max-w-sm rounded-lg border border-pink-200 bg-white p-3 shadow-lg"
            role="status"
          >
            <p className="text-sm text-zinc-800">{t.message}</p>
            {t.actionHref && t.actionLabel ? (
              <Link
                className="mt-2 inline-block text-sm font-medium text-pink-600 hover:text-pink-700"
                href={t.actionHref}
              >
                {t.actionLabel}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
