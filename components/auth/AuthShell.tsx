"use client";

import { useState } from "react";
import AdSlot from "@/components/ads/AdSlot";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import { ADS_SLOTS } from "@/lib/adsConfig";

type Mode = "signIn" | "signUp" | "confirm";

type AuthShellProps = {
  mode: Mode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

function resolveSlots(mode: Mode) {
  if (mode === "signUp") {
    return {
      left: ADS_SLOTS.authSignUpLeft,
      right: ADS_SLOTS.authSignUpRight,
      mobileTop: ADS_SLOTS.authSignUpMobileTop,
      mobileBottom: ADS_SLOTS.authSignUpMobileBottom,
    };
  }
  return {
    left: ADS_SLOTS.authSignInLeft,
    right: ADS_SLOTS.authSignInRight,
    mobileTop: ADS_SLOTS.authSignInMobileTop,
    mobileBottom: ADS_SLOTS.authSignInMobileBottom,
  };
}

export default function AuthShell({ mode, title, subtitle, children }: AuthShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const slots = resolveSlots(mode);
  const showMobileAuthAds = mode === "signIn" || mode === "signUp";
  const showAuthBrand = mode === "signIn" || mode === "signUp";

  return (
    <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
      <HomeNavbar isLoggedIn={false} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((value) => !value)} />
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="mx-auto grid w-full max-w-7xl items-start gap-6 px-6 py-6 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[240px_minmax(0,1fr)_240px]">
        <aside className="hidden lg:block">
          <div className="h-[calc(100vh-2rem)] rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
            <AdSlot className="block h-[calc(100vh-8rem)] w-full rounded-md bg-pink-50/50" slot={slots.left} />
          </div>
        </aside>

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-between sm:min-h-0 lg:self-center">
          {showMobileAuthAds ? (
            <div className="mb-4 sm:hidden">
              <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
                <AdSlot className="block min-h-[140px] w-full rounded-md bg-pink-50/50" slot={slots.mobileTop} />
              </div>
            </div>
          ) : null}

          {showAuthBrand ? (
            <p className="mb-3 text-left text-xl font-semibold text-pink-300 sm:hidden">MatchMate.live</p>
          ) : null}

          <div className="w-full p-0 sm:rounded-2xl sm:border sm:border-pink-200 sm:bg-white sm:p-6 sm:shadow-sm">
            {showAuthBrand ? (
              <p className="mb-3 hidden text-center text-2xl font-semibold text-pink-300 sm:block">
                MatchMate.live
              </p>
            ) : null}
            <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
            <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>

          {showMobileAuthAds ? (
            <div className="mt-4 sm:hidden">
              <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
                <AdSlot className="block min-h-[140px] w-full rounded-md bg-pink-50/50" slot={slots.mobileBottom} />
              </div>
            </div>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <div className="h-[calc(100vh-2rem)] rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
            <AdSlot className="block h-[calc(100vh-8rem)] w-full rounded-md bg-pink-50/50" slot={slots.right} />
          </div>
        </aside>
      </div>
    </main>
  );
}
