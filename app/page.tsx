"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { configureAmplifyAuth } from "@/lib/amplify";
import {
  DEFAULT_ANON_GENDER,
  DEFAULT_MAX_AGE,
  DEFAULT_MIN_AGE,
  FilterState,
  SearchProfile,
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

export default function Home() {
  const hasAutoRequestedRef = useRef(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(false);
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

  async function runSearch(nextFilters: FilterState) {
    setLoading(true);
    setProfiles([]);
    try {
      const payload = await fetchProfilesByLocation(nextFilters);
      setProfiles(payload.items ?? []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    configureAmplifyAuth();
    getCurrentUser()
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
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
        isLoggedIn={isLoggedIn}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
      />
      {!isLoggedIn ? <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} /> : null}

      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <AdRail slot={ADS_SLOTS.desktopLeft} />

          <div>
            <FilterBar
              filters={filters}
              hasRequestedLocation={hasRequestedLocation}
              onOpenFilters={() => setIsFilterOpen(true)}
              onAllowLocation={requestLocationAndSearch}
            />

            {loading ? <p className="mt-8 text-zinc-800">Loading profiles...</p> : null}
            {!loading && hasRequestedLocation ? <ProfilesGrid profiles={profiles} /> : null}
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
