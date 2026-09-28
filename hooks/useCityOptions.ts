import { useEffect, useState } from "react";
import { fetchCityOptions } from "@/lib/geoData";

/** City options for a country dropdown — empty until that country's list has loaded. */
export function useCityOptions(countryValue: string): string[] {
  const [loaded, setLoaded] = useState<{ country: string; cities: string[] }>({
    country: "",
    cities: [],
  });

  useEffect(() => {
    if (!countryValue) return;
    let cancelled = false;
    fetchCityOptions(countryValue).then((cities) => {
      if (!cancelled) setLoaded({ country: countryValue, cities });
    });
    return () => {
      cancelled = true;
    };
  }, [countryValue]);

  // Keyed by country so a stale list never shows under a newly picked country.
  return loaded.country === countryValue ? loaded.cities : [];
}
