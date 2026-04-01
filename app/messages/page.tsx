"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import AdRail from "@/components/home/AdRail";
import AdSlot from "@/components/ads/AdSlot";
import { ADS_SLOTS } from "@/lib/adsConfig";
import { configureAmplifyAuth } from "@/lib/amplify";

export default function MessagesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const isConfigured = configureAmplifyAuth();
    if (!isConfigured) {
      setIsLoggedIn(false);
      return;
    }
    getCurrentUser()
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
      <HomeNavbar
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
      />
      <MobileDrawer
        isLoggedIn={isLoggedIn}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={async () => {
          await signOut();
          setIsLoggedIn(false);
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <AdRail slot={ADS_SLOTS.desktopLeft} />

          <section className="relative min-h-[55vh] rounded-2xl border border-pink-200 bg-white p-6 shadow-sm lg:min-h-[calc(100vh-7rem)]">
            <div className={!isLoggedIn ? "pointer-events-none select-none blur-sm" : undefined}>
              <h1 className="text-2xl font-semibold text-zinc-900">Messages</h1>
              <p className="mt-2 text-sm text-zinc-600">
                Your conversations will appear here.
              </p>
            </div>

            {!isLoggedIn ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl px-3 py-4 backdrop-blur-sm sm:px-0 sm:py-0">
                <div className="mx-4 w-full max-w-md rounded-xl bg-white p-5 text-center shadow-md">
                  <h2 className="text-lg font-semibold text-zinc-900">Login Required</h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    You must be logged in to start conversations.
                  </p>
                </div>
              </div>
            ) : null}
          </section>

          <AdRail slot={ADS_SLOTS.desktopRight} />
        </div>

        <div className="mt-6 sm:hidden">
          <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
            <AdSlot
              className="block min-h-[220px] w-full rounded-md bg-pink-50/50"
              slot={ADS_SLOTS.mobileBottom}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
