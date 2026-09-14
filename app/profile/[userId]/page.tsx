"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import AdRail from "@/components/home/AdRail";
import AdSlot from "@/components/ads/AdSlot";
import { ADS_SLOTS } from "@/lib/adsConfig";
import { useAuth } from "@/lib/auth/AuthProvider";
import { redirectIfSessionExpired } from "@/lib/api/authRedirect";
import { fetchProfileByUserId } from "@/lib/profileViewApi";
import { profilePhotoSrc } from "@/lib/profilePhoto";
import type { ProfileResponse } from "@/lib/onboarding/types";
import { formatLastSeenStatus } from "@/lib/profileSearchDisplay";
import { titleCase } from "@/lib/location";

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
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId?.trim()) {
      // Deferred to a microtask, not called synchronously in the effect body — same
      // reasoning as AuthProvider's equivalent case: avoids a same-tick cascading render.
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
        // Most common cause here is an anonymous visitor, not an expired session —
        // "required" gets an accurate "please sign in to continue" instead of implying
        // they had a session at all.
        if (!redirectIfSessionExpired(e, router, pathname, "required")) {
          setError(e instanceof Error ? e.message : "Could not load profile.");
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [userId, router, pathname]);

  const name = profile?.name?.trim() || "Member";
  const photoSrc = profilePhotoSrc(profile?.photos?.[0]);
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
              <Link className="text-sm font-medium text-pink-600 hover:text-pink-700" href="/">
                ← Back to search
              </Link>
            </div>

            {loading && (
              <p className="flex flex-1 items-center justify-center px-4 py-16 text-sm text-zinc-600" role="status">
                Loading profile…
              </p>
            )}

            {error && !loading && (
              <p className="flex flex-1 items-center justify-center px-4 py-16 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            {!loading && !error && profile && (
              <>
                <div className="relative w-full shrink-0 bg-pink-50/50">
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-2xl sm:aspect-[16/10] sm:max-w-none lg:aspect-[21/9] lg:max-h-[min(42vh,520px)]">
                    <Image
                      alt={`${name}'s photo`}
                      className="object-contain object-center"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, min(100vw - 560px, 896px)"
                      src={photoSrc}
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-pink-100 pb-6">
                    <div>
                      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">{name}</h1>
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

                  <div className="mt-auto border-t border-pink-100 pt-8">
                    <Link
                      className="inline-flex w-full items-center justify-center rounded-lg bg-pink-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-pink-700 sm:w-auto sm:min-w-[200px]"
                      href={`/messages?to=${encodeURIComponent(userId)}`}
                    >
                      Send message
                    </Link>
                  </div>
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
