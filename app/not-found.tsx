"use client";

import { useState } from "react";
import Link from "next/link";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function NotFound() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, signOut } = useAuth();

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
          <p className="text-center text-2xl font-bold text-pink-300">404</p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">Page not found</h1>
          <p className="mt-2 text-sm text-zinc-600">
            The page you&apos;re looking for doesn&apos;t exist or may have moved.
          </p>
          <Link
            className="mt-6 inline-flex items-center justify-center rounded-md bg-pink-300 px-4 py-2 text-sm font-medium text-white"
            href="/"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
