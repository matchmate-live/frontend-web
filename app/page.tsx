"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  DEFAULT_ANON_GENDER,
  DEFAULT_MAX_AGE,
  DEFAULT_MIN_AGE,
  FilterState,
  SearchProfile,
  SearchResponse,
  fetchProfilesByLocation,
} from "@/lib/search";
import { guessCountryFromTimezone, reverseGeocode } from "@/lib/location";
import { getCityOptionsByCountry, getCountryOptions } from "@/lib/geoData";
import { ADS_SLOTS } from "@/lib/adsConfig";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import FilterBar from "@/components/home/FilterBar";
import FilterDialog from "@/components/home/FilterDialog";
import AdRail from "@/components/home/AdRail";
import ProfilesGrid from "@/components/home/ProfilesGrid";
import EmailVerificationBanner from "@/components/home/EmailVerificationBanner";

export default function Home() {
  const hasAutoRequestedRef = useRef(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const { isLoggedIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    minAge: DEFAULT_MIN_AGE,
    maxAge: DEFAULT_MAX_AGE,
    country: "",
    city: "",
    gender: DEFAULT_ANON_GENDER,
  });
  const [draftFilters, setDraftFilters] = useState<FilterState>({
    minAge: DEFAULT_MIN_AGE,
    maxAge: DEFAULT_MAX_AGE,
    country: "",
    city: "",
    gender: DEFAULT_ANON_GENDER,
  });
  const countries = useMemo(() => getCountryOptions(), []);
  const cityOptions = useMemo(
    () => getCityOptionsByCountry(draftFilters.country),
    [draftFilters.country],
  );

  /**
   * Shared control flow for both a fresh search and "load more": cancels any
   * still-in-flight request first (so a slower, older response can never land
   * after — and overwrite — a newer one), then routes the result through
   * whichever callbacks the caller wants. Only what happens with the result
   * differs between runSearch (replace) and loadMore (append).
   */
  async function performSearch(
    nextFilters: FilterState,
    {
      nextToken: pageToken,
      onStart,
      onSuccess,
      onError,
      onSettle,
      fallbackErrorMessage,
    }: {
      nextToken?: string | null;
      onStart: () => void;
      onSuccess: (payload: SearchResponse) => void;
      onError: (message: string) => void;
      onSettle: () => void;
      fallbackErrorMessage: string;
    },
  ) {
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    onStart();
    try {
      const payload = await fetchProfilesByLocation(nextFilters, {
        signal: controller.signal,
        nextToken: pageToken,
      });
      if (searchAbortRef.current !== controller) return; // superseded by a newer search
      onSuccess(payload);
    } catch (err) {
      if (controller.signal.aborted) return; // cancelled; a newer search owns state now
      onError(err instanceof Error && err.message ? err.message : fallbackErrorMessage);
    } finally {
      if (searchAbortRef.current === controller) {
        onSettle();
      }
    }
  }

  async function runSearch(nextFilters: FilterState) {
    await performSearch(nextFilters, {
      onStart: () => {
        setLoading(true);
        setProfiles([]);
        setSearchError(null);
        setLoadMoreError(null);
        setNextToken(null);
      },
      onSuccess: (payload) => {
        setProfiles(payload.items ?? []);
        setNextToken(payload.nextToken ?? null);
      },
      onError: (message) => {
        setProfiles([]);
        setSearchError(message);
      },
      onSettle: () => setLoading(false),
      fallbackErrorMessage: "We couldn't load profiles right now. Please try again.",
    });
  }

  async function loadMore() {
    if (!nextToken || loading || loadingMore) return;
    await performSearch(filters, {
      nextToken,
      onStart: () => setLoadingMore(true),
      onSuccess: (payload) => {
        setProfiles((prev) => [...prev, ...(payload.items ?? [])]);
        setNextToken(payload.nextToken ?? null);
      },
      onError: setLoadMoreError,
      onSettle: () => setLoadingMore(false),
      fallbackErrorMessage: "Couldn't load more profiles.",
    });
  }

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
    };
  }, []);

  async function requestLocationAndSearch() {
    setHasRequestedLocation(true);
    setLoading(true);
    setProfiles([]);

    if (!navigator.geolocation) {
      const guessedCountry = guessCountryFromTimezone();
      if (guessedCountry) {
        const nextFilters = { ...filters, country: guessedCountry, city: "" };
        setFilters(nextFilters);
        setDraftFilters(nextFilters);
        await runSearch(nextFilters);
      } else {
        setProfiles([]);
        setLoading(false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const geo = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          if (!geo.country) {
            throw new Error("Could not detect your country from browser location.");
          }

          const normalizedCountry = geo.country.toLowerCase();
          const normalizedCity = geo.city?.toLowerCase();
          const nextFilters = {
            ...filters,
            country: normalizedCountry,
            city: normalizedCity ?? "",
          };
          setFilters(nextFilters);
          setDraftFilters(nextFilters);
          await runSearch(nextFilters);
        } catch {
          setProfiles([]);
          setLoading(false);
        }
      },
      async () => {
        try {
          const guessedCountry = guessCountryFromTimezone();
          if (!guessedCountry) {
            throw new Error("Could not determine your location right now.");
          }

          const nextFilters = { ...filters, country: guessedCountry, city: "" };
          setFilters(nextFilters);
          setDraftFilters(nextFilters);
          await runSearch(nextFilters);
        } catch {
          setProfiles([]);
          setLoading(false);
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 120000 },
    );
  }

  useEffect(() => {
    if (hasAutoRequestedRef.current) return;
    hasAutoRequestedRef.current = true;
    requestLocationAndSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        onLogout={signOut}
      />

      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <AdRail slot={ADS_SLOTS.desktopLeft} />

          <div>
            <EmailVerificationBanner />
            <FilterBar
              filters={filters}
              hasRequestedLocation={hasRequestedLocation}
              onOpenFilters={() => setIsFilterOpen(true)}
              onAllowLocation={requestLocationAndSearch}
            />

            {loading ? <p className="mt-8 text-zinc-800">Loading profiles...</p> : null}
            {!loading && hasRequestedLocation ? (
              <ProfilesGrid
                profiles={profiles}
                errorMessage={searchError}
                onRetry={() => runSearch(filters)}
                hasMore={Boolean(nextToken)}
                loadingMore={loadingMore}
                loadMoreError={loadMoreError}
                onLoadMore={loadMore}
              />
            ) : null}
          </div>

          <AdRail slot={ADS_SLOTS.desktopRight} />
        </div>
      </div>

      <FilterDialog
        cityOptions={cityOptions}
        countries={countries}
        draftFilters={draftFilters}
        open={isFilterOpen}
        onClose={() => {
          setDraftFilters(filters);
          setIsFilterOpen(false);
        }}
        onDraftChange={setDraftFilters}
        onApply={async () => {
          if (!draftFilters.country) return;
          const nextFilters = {
            ...draftFilters,
            minAge: Math.max(18, Math.min(draftFilters.minAge, draftFilters.maxAge)),
            maxAge: Math.min(100, Math.max(draftFilters.maxAge, draftFilters.minAge)),
          };
          setFilters(nextFilters);
          setHasRequestedLocation(true);
          setIsFilterOpen(false);
          await runSearch(nextFilters);
        }}
      />
    </main>
  );
}
