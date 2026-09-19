"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { fetchMyProfileCached } from "@/lib/onboarding";
import { ADS_SLOTS } from "@/lib/adsConfig";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import FilterBar from "@/components/home/FilterBar";
import FilterDialog from "@/components/home/FilterDialog";
import AdRail from "@/components/home/AdRail";
import AdSlot from "@/components/ads/AdSlot";
import ProfilesGrid from "@/components/home/ProfilesGrid";
import ProfileCardSkeleton from "@/components/home/ProfileCardSkeleton";
import EmailVerificationBanner from "@/components/home/EmailVerificationBanner";

/** Reconstructs filters from `?country=...&city=...&gender=...&minAge=...&maxAge=...`, or null if unset. */
function filtersFromParams(params: URLSearchParams): FilterState | null {
  const country = params.get("country");
  if (!country) return null;
  const minAge = Number(params.get("minAge"));
  const maxAge = Number(params.get("maxAge"));
  const gender = params.get("gender");
  return {
    country,
    city: params.get("city") ?? "",
    minAge: Number.isFinite(minAge) ? minAge : DEFAULT_MIN_AGE,
    maxAge: Number.isFinite(maxAge) ? maxAge : DEFAULT_MAX_AGE,
    gender: gender === "male" || gender === "female" ? gender : DEFAULT_ANON_GENDER,
  };
}

export default function HomeClient() {
  const hasAutoRequestedRef = useRef(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const { isLoggedIn, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  const [pendingFetch, setPendingFetch] = useState<
    { kind: "filters"; filters: FilterState } | { kind: "geolocate" } | null
  >(null);
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
   * Shared control flow for a fresh search and "load more": cancels any in-flight request
   * first (so a slower, older response can't overwrite a newer one), then routes the
   * result through whichever callbacks the caller wants.
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

  /** window.location.search as of the last render this component accounted for (wrote via
   * syncFiltersToUrl, or read via the render-time sync below) — lets that check tell "we
   * just wrote this" from "a back/forward navigation changed the URL". */
  const [lastSeenSearch, setLastSeenSearch] = useState<string | null>(null);
  // True from the moment syncFiltersToUrl calls router.replace() until
  // window.location.search actually reflects it. router.replace() doesn't update
  // window.location synchronously — there's a real lag — and without this flag, a render
  // during that lag reads the still-stale window.location.search, wrongly concludes an
  // external navigation happened, and stomps lastSeenSearch back to the stale value. Once
  // that happens, the *next* read (once the URL genuinely catches up) looks like a second
  // "external" change and fires a second, identical search — confirmed via console trace.
  const awaitingUrlWriteRef = useRef(false);

  /** Reflects filters into the URL query string (replace, not push — no history spam per
   * keystroke/filter tweak) so browser back-navigation from a profile or another page
   * restores this exact search instead of resetting to a fresh auto-detected one. */
  function syncFiltersToUrl(f: FilterState) {
    const params = new URLSearchParams({
      country: f.country,
      minAge: String(f.minAge),
      maxAge: String(f.maxAge),
      gender: f.gender,
    });
    if (f.city) params.set("city", f.city);
    const qs = `?${params.toString()}`;
    awaitingUrlWriteRef.current = true;
    setLastSeenSearch(qs);
    router.replace(`${pathname}${qs}`, { scroll: false });
  }

  async function applyFilters(nextFilters: FilterState) {
    if (!isMountedRef.current) return;
    setFilters(nextFilters);
    setDraftFilters(nextFilters);
    setHasRequestedLocation(true);
    syncFiltersToUrl(nextFilters);
    await runSearch(nextFilters);
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

  /** Only ever called from requestLocationAndSearch, which only runs for the very first,
   * no-URL-params auto-search — filters.gender is still whatever the initial useState
   * default was at that point, so it's always safe to resolve and override it here. */
  async function resolveDefaultGender(): Promise<"male" | "female"> {
    if (!isLoggedIn) return DEFAULT_ANON_GENDER;
    try {
      const profile = await fetchMyProfileCached();
      if (profile?.genderPreference === "male" || profile?.genderPreference === "female") {
        return profile.genderPreference;
      }
    } catch {
      // fall through to the anonymous default
    }
    return DEFAULT_ANON_GENDER;
  }

  async function requestLocationAndSearch() {
    setHasRequestedLocation(true);
    setLoading(true);
    setProfiles([]);

    const gender = await resolveDefaultGender();

    if (!navigator.geolocation) {
      const guessedCountry = guessCountryFromTimezone();
      if (guessedCountry) {
        await applyFilters({ ...filters, gender, country: guessedCountry, city: "" });
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
          // Only applied if it's actually one of this country's dropdown options —
          // reverse-geocoded names don't reliably match this dataset's own naming.
          const cityOptionsForCountry = getCityOptionsByCountry(normalizedCountry);
          const validatedCity =
            normalizedCity && cityOptionsForCountry.includes(normalizedCity) ? normalizedCity : "";
          await applyFilters({ ...filters, gender, country: normalizedCountry, city: validatedCity });
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

          await applyFilters({ ...filters, gender, country: guessedCountry, city: "" });
        } catch {
          setProfiles([]);
          setLoading(false);
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 120000 },
    );
  }

  function syncFromLocation() {
    const currentSearch = window.location.search;
    if (currentSearch === lastSeenSearch) {
      awaitingUrlWriteRef.current = false; // our own write (if any) has now landed
      return;
    }
    if (awaitingUrlWriteRef.current) {
      // window.location hasn't caught up to our own most recent router.replace() yet —
      // this mismatch is lag, not an external navigation. Don't act on it.
      return;
    }
    setLastSeenSearch(currentSearch);
    const fromUrl = filtersFromParams(new URLSearchParams(currentSearch));
    if (fromUrl) {
      hasAutoRequestedRef.current = true;
      setFilters(fromUrl);
      setDraftFilters(fromUrl);
      setHasRequestedLocation(true);
      setPendingFetch({ kind: "filters", filters: fromUrl });
    } else if (!hasAutoRequestedRef.current) {
      setPendingFetch({ kind: "geolocate" });
    }
  }

  // The first sync must happen in an effect, not during render: SSR always renders the
  // default state (no window there), so the first client render has to match it exactly
  // or React flags a hydration mismatch.
  const hasHydratedRef = useRef(false);
  useEffect(() => {
    hasHydratedRef.current = true;
    syncFromLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render-time URL sync for every render after hydration — deliberately not effect-
  // triggered. Two effect-based attempts (useSearchParams(), then a popstate listener)
  // both proved unreliable for catching back/forward navigation to this page. Checking
  // window.location.search during render instead can't be missed, since the component
  // must render for the user to see anything. hasHydratedRef excludes the first render.
  if (hasHydratedRef.current) {
    syncFromLocation();
  }

  // handledFetchRef survives React Strict Mode's dev-only double-invocation of this effect
  // (setPendingFetch(null) alone doesn't: state updates are deferred, so a second immediate
  // invocation would still see the same truthy pendingFetch and fire the search twice). A
  // ref updates synchronously, so it's visible to that second invocation right away.
  const handledFetchRef = useRef<typeof pendingFetch>(null);
  useEffect(() => {
    if (!pendingFetch || handledFetchRef.current === pendingFetch) return;
    handledFetchRef.current = pendingFetch;
    hasAutoRequestedRef.current = true;
    setPendingFetch(null);
    if (pendingFetch.kind === "geolocate") {
      requestLocationAndSearch();
    } else {
      runSearch(pendingFetch.filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFetch]);

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
        <div className="grid items-stretch gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <AdRail slot={ADS_SLOTS.desktopLeft} />

          <div>
            <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">
              Find your match on MatchMate.live
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Browse real profiles for dating and matrimonial matches near you, filtered by country, city,
              age, and gender — free to join, free to search.
            </p>
            <EmailVerificationBanner />
            <FilterBar
              filters={filters}
              hasRequestedLocation={hasRequestedLocation}
              onOpenFilters={() => setIsFilterOpen(true)}
              onAllowLocation={requestLocationAndSearch}
            />

            {loading ? (
              <section className="mt-6 grid w-full grid-cols-1 gap-4" aria-busy="true" role="status">
                <span className="sr-only">Loading profiles…</span>
                {Array.from({ length: 5 }).map((_, i) => (
                  <ProfileCardSkeleton key={i} />
                ))}
              </section>
            ) : null}
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

            {/* Always shown, regardless of search loading state — an ad shouldn't wait on the request. */}
            <div className="mt-6 lg:hidden">
              <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
                <AdSlot
                  className="block min-h-[220px] w-full rounded-md bg-pink-50/50"
                  slot={ADS_SLOTS.mobileBottom}
                />
              </div>
            </div>
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
          setIsFilterOpen(false);
          await applyFilters(nextFilters);
        }}
      />
    </main>
  );
}
