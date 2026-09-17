"use client";

import { useEffect, useState } from "react";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import AdRail from "@/components/home/AdRail";
import AdSlot from "@/components/ads/AdSlot";
import ErrorCard from "@/components/ui/ErrorCard";
import { ADS_SLOTS } from "@/lib/adsConfig";
import { useAuth } from "@/lib/auth/AuthProvider";
import { fetchMyProfileCached, type ProfileResponse } from "@/lib/onboarding";
import ProfileTab from "./ProfileTab";
import PhotosTab from "./PhotosTab";
import AccountTab from "./AccountTab";
import SettingsSkeleton from "./SettingsSkeleton";

type Tab = "profile" | "photos" | "account";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "photos", label: "Photos" },
  { id: "account", label: "Account" },
];

export default function SettingsView() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (authLoading || !isLoggedIn) {
      return;
    }
    let cancelled = false;
    fetchMyProfileCached({ forceRefresh: retryToken > 0 })
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Could not load your profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, retryToken]);

  const showLoading = authLoading || (isLoggedIn && loading);

  function renderTabContent() {
    if (showLoading) {
      return <SettingsSkeleton />;
    }
    if (loadError) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center">
          <ErrorCard
            actionLabel="Try again"
            message={loadError}
            title="Couldn't load your profile"
            onAction={() => {
              setLoading(true);
              setLoadError(null);
              setRetryToken((t) => t + 1);
            }}
          />
        </div>
      );
    }
    if (activeTab === "profile") {
      return <ProfileTab profile={profile} onSaved={setProfile} />;
    }
    if (activeTab === "photos") {
      return <PhotosTab profile={profile} onSaved={setProfile} />;
    }
    return <AccountTab profile={profile} />;
  }

  if (!authLoading && !isLoggedIn) {
    return (
      <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
        <HomeNavbar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)} />
        <MobileDrawer isLoggedIn={false} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-2xl border border-pink-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-zinc-900">Sign in required</h1>
            <p className="mt-2 text-sm text-zinc-600">You need to be signed in to view profile settings.</p>
            <a
              className="mt-4 inline-block rounded-md bg-pink-300 px-4 py-2 text-sm text-white"
              href="/auth/sign-in?next=%2Fsettings"
            >
              Sign in
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
      <HomeNavbar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)} />
      <MobileDrawer isLoggedIn={isLoggedIn} open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={signOut} />

      <div className="border-b border-pink-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl gap-1 px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`cursor-pointer border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-pink-500 text-pink-600"
                  : "border-transparent text-zinc-600 hover:text-zinc-900"
              }`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="grid items-stretch gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <AdRail slot={ADS_SLOTS.settingsDesktopLeft} />

          <div>
            {renderTabContent()}

            <div className="mt-6 lg:hidden">
              <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
                <AdSlot
                  className="block min-h-[220px] w-full rounded-md bg-pink-50/50"
                  slot={ADS_SLOTS.settingsMobileBottom}
                />
              </div>
            </div>
          </div>

          <AdRail slot={ADS_SLOTS.settingsDesktopRight} />
        </div>
      </div>
    </main>
  );
}
