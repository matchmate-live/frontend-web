import { useEffect, useState } from "react";
import { loadCityOptions } from "@/lib/geoData";

export type CityOptionsStatus = "idle" | "loading" | "ready" | "error";

export type CityOptions = {
  /** Cities for the chosen country. Empty until the list loads, or if it has none. */
  cities: string[];
  /** "ready" with no cities means the country has none in the data, not that it's loading. */
  status: CityOptionsStatus;
};

// Cities for the chosen country, with whether they're still loading or failed to load.
export function useCityOptions(countryValue: string): CityOptions {
  const [loaded, setLoaded] = useState<{
    country: string;
    cities: string[];
    status: "ready" | "error";
  }>({ country: "", cities: [], status: "ready" });

  useEffect(() => {
    if (!countryValue) return;
    let cancelled = false;
    loadCityOptions(countryValue).then(
      (cities) => {
        if (!cancelled) setLoaded({ country: countryValue, cities, status: "ready" });
      },
      () => {
        if (!cancelled) setLoaded({ country: countryValue, cities: [], status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [countryValue]);

  if (!countryValue) return { cities: [], status: "idle" };
  // Don't show the previous country's list while the new one loads.
  if (loaded.country !== countryValue) return { cities: [], status: "loading" };
  return { cities: loaded.cities, status: loaded.status };
}
