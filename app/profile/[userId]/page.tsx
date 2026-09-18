"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import AdRail from "@/components/home/AdRail";
import AdSlot from "@/components/ads/AdSlot";
import BackButton from "@/components/ui/BackButton";
import ErrorCard from "@/components/ui/ErrorCard";
import ProfileDetailSkeleton from "@/components/profile/ProfileDetailSkeleton";
import ProfilePhotoCarousel from "@/components/profile/ProfilePhotoCarousel";
import { ADS_SLOTS } from "@/lib/adsConfig";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isSessionExpiredError } from "@/lib/api/authRedirect";
import { fetchProfileByUserId } from "@/lib/profileViewApi";
import type { ProfileResponse } from "@/lib/onboarding/types";
import { formatLastSeenStatus } from "@/lib/profileSearchDisplay";
import { titleCase } from "@/lib/location";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

function isRecentlyOnline(lastSeen: number | undefined): boolean {
  if (typeof lastSeen !== "number" || !Number.isFinite(lastSeen)) return false;
  return Date.now() - lastSeen < ONLINE_WINDOW_MS;
}

function displayGender(p: ProfileResponse): string {
  if (p.gender?.trim()) return titleCase(p.gender);
  return "—";
}

function displayCityCountry(p: ProfileResponse): string {
  const cityRaw = p.city?.trim();
  const city = cityRaw ? titleCase(cityRaw) : null;
  const country = p.country?.trim() ? titleCase(p.country) : null;
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return "—";
}

export default function PublicProfilePage() {
  const params = useParams();
  const userIdRaw = params?.userId;
  const userId = typeof userIdRaw === "string" ? userIdRaw : Array.isArray(userIdRaw) ? userIdRaw[0] : "";

  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, userId: ownUserId, signOut } = useAuth();
  const isOwnProfile = ownUserId !== null && ownUserId === userId;
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  function handleBack() {
    // history.length > 1 means there's actually somewhere to go back to (e.g. search
    // results, messages, another profile) — falls back to "/" for a profile opened
    // directly, such as from a shared link or a new tab.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  useEffect(() => {
    // Public page: anyone can view a profile, signed in or not (the backend returns a
    // redacted view for anonymous/other viewers). Only "Send message" is gated on isLoggedIn.
    if (!userId?.trim()) {
      // Deferred to a microtask — avoids a same-tick cascading render (same as AuthProvider).
      Promise.resolve().then(() => {
        setLoading(false);
        setError("Missing profile id.");
      });
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);

    fetchProfileByUserId(userId.trim(), { signal: ac.signal })
      .then((p) => {
        setProfile(p);
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        // Never redirects on its own. A real 401 already triggered the session-expired
        // toast (see clientError.ts); this just skips the redundant inline error.
        if (!isSessionExpiredError(e)) {
          setError(e instanceof Error ? e.message : "Could not load profile.");
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [userId]);

  const name = profile?.name?.trim() || "Member";
  const online = isRecentlyOnline(profile?.lastSeen);

  return (
    <main className="flex min-h-screen w-full flex-col bg-pink-50/10 text-zinc-900">
      <HomeNavbar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)} />
      <MobileDrawer
        isLoggedIn={isLoggedIn}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={signOut}
      />

      {/* Mobile: ad top (slot A) */}
      <div className="border-b border-pink-100 bg-white/80 px-4 py-3 lg:hidden">
        <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
        <AdSlot
          className="block min-h-[100px] w-full rounded-md bg-pink-50/50"
          slot={ADS_SLOTS.profileA}
        />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-0 lg:px-6 lg:py-6">
        <div className="grid flex-1 items-stretch gap-0 lg:grid-cols-[280px_minmax(0,1fr)_280px] lg:gap-6">
          <AdRail slot={ADS_SLOTS.profileA} />

          {/* Full-screen-style profile column (not a card) */}
          <div className="flex min-h-0 min-h-[calc(100dvh-3.5rem)] flex-1 flex-col bg-white lg:min-h-[calc(100vh-7rem)]">
            <div className="border-b border-pink-100 px-4 py-3 sm:px-6">
              <BackButton label="Back" onClick={handleBack} />
            </div>

            {loading && <ProfileDetailSkeleton />}

            {error && !loading && (
              <div className="flex flex-1 items-center justify-center px-4 py-16">
                <ErrorCard actionLabel="Go back" message={error} title="Profile unavailable" onAction={handleBack} />
              </div>
            )}

            {!loading && !error && profile && (
              <>
                <ProfilePhotoCarousel name={name} photos={profile.photos} />

                <div className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-pink-100 pb-6">
                    <div>
                      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                        {name}
                        {profile ? <VerifiedBadge iconClassName="h-8 w-8" /> : null}
                      </h1>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-700">
                        <span className="font-medium text-zinc-800">{displayGender(profile)}</span>
                        <span className="text-zinc-600">{displayCityCountry(profile)}</span>
                      </div>
                    </div>
                    {profile.age != null ? (
                      <span className="shrink-0 text-3xl font-semibold tabular-nums text-zinc-800 sm:text-4xl">
                        {profile.age}
                      </span>
                    ) : (
                      <span className="shrink-0 text-3xl font-medium text-zinc-400 sm:text-4xl">—</span>
                    )}
                  </div>

                  <p className={`text-sm sm:text-base ${online ? "font-medium text-emerald-700" : "text-zinc-600"}`}>
                    {online
                      ? "Status: Online"
                      : typeof profile.lastSeen === "number" && Number.isFinite(profile.lastSeen)
                        ? `Status: Last seen — ${formatLastSeenStatus(profile.lastSeen)}`
                        : "Status: —"}
                  </p>

                  {profile.description?.trim() ? (
                    <div className="border-t border-pink-100 pt-6">
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">About</h2>
                      <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-zinc-800">
                        {profile.description.trim()}
                      </p>
                    </div>
                  ) : null}

                  {!isOwnProfile ? (
                    <div className="mt-auto border-t border-pink-100 pt-8">
                      {isLoggedIn ? (
                        <Link
                          className="inline-flex w-full items-center justify-center rounded-lg bg-pink-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-pink-700 sm:w-auto sm:min-w-[200px]"
                          href={`/messages?to=${encodeURIComponent(userId)}`}
                        >
                          Send message
                        </Link>
                      ) : (
                        <Link
                          className="inline-flex w-full items-center justify-center rounded-lg bg-pink-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-pink-700 sm:w-auto sm:min-w-[200px]"
                          href={`/auth/sign-in?next=${encodeURIComponent(`/messages?to=${userId}`)}`}
                        >
                          Sign in to send a message
                        </Link>
                      )}
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>

          <AdRail slot={ADS_SLOTS.profileB} />
        </div>
      </div>

      {/* Mobile: ad bottom (slot B) */}
      <div className="mt-auto border-t border-pink-100 bg-white/80 px-4 py-4 lg:hidden">
        <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
        <AdSlot
          className="block min-h-[100px] w-full rounded-md bg-pink-50/50"
          slot={ADS_SLOTS.profileB}
        />
      </div>
    </main>
  );
}
