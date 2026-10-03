import { useEffect, useState } from "react";
import { fetchCityOptions } from "@/lib/geoData";

// Cities for the chosen country. Empty until the list loads.
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

  // Don't show the previous country's list while the new one loads.
  return loaded.country === countryValue ? loaded.cities : [];
}
