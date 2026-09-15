"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Root error boundary — catches uncaught rendering errors under the root layout (not the
 * layout itself; see global-error.tsx). Still nested in AuthProvider, so useAuth() is safe
 * here unlike in global-error.tsx. `unstable_retry` is Next 16.2's recovery function,
 * replacing the older `reset` prop.
 */
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, signOut } = useAuth();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen w-full flex-col bg-pink-50/10 text-zinc-900">
      <HomeNavbar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((value) => !value)} />
      <MobileDrawer
        isLoggedIn={isLoggedIn}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={signOut}
      />

      <div className="flex w-full flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-pink-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-zinc-600">
            An unexpected error occurred. You can try again, or head back home.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              className="cursor-pointer rounded-md bg-pink-300 px-4 py-2 text-sm font-medium text-white"
              type="button"
              onClick={() => unstable_retry()}
            >
              Try again
            </button>
            <Link
              className="rounded-md border border-pink-200 bg-white px-4 py-2 text-sm text-zinc-900"
              href="/"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
