// Deep import so we don't bundle the 8 MB city data. Cities come from
// /api/geo/cities/[isoCode] instead.
import Country from "country-state-city/lib/country";

type CountryOption = {
  value: string;
  label: string;
  isoCode: string;
};

export function getCountryOptions(): CountryOption[] {
  return Country.getAllCountries()
    .map((country) => ({
      value: country.name.toLowerCase(),
      label: country.name,
      isoCode: country.isoCode,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Browsers cache city lists for a year. Bump this whenever the lists change (route output,
// country-state-city upgrade) so everyone fetches the new ones.
// v2: removed the 1,000-city cap.
const CITY_LIST_VERSION = 2;

const cityRequests = new Map<string, Promise<string[]>>();

// City names for a country, fetched once per page load. Resolves [] for an unknown country
// (or one with no cities in the data) and rejects if the request fails; failures aren't
// cached, so the next call retries.
export function loadCityOptions(countryValue: string): Promise<string[]> {
  if (!countryValue) return Promise.resolve([]);
  const country = Country.getAllCountries().find(
    (item) => item.name.toLowerCase() === countryValue.toLowerCase(),
  );
  if (!country) return Promise.resolve([]);

  let request = cityRequests.get(country.isoCode);
  if (!request) {
    request = fetch(`/api/geo/cities/${country.isoCode}?v=${CITY_LIST_VERSION}`).then((res) => {
      if (!res.ok) throw new Error(`City list request failed (${res.status})`);
      return res.json() as Promise<string[]>;
    });
    request.catch(() => cityRequests.delete(country.isoCode));
    cityRequests.set(country.isoCode, request);
  }
  return request;
}

// Same as loadCityOptions, but a failed request resolves [] instead of rejecting.
export function fetchCityOptions(countryValue: string): Promise<string[]> {
  return loadCityOptions(countryValue).catch(() => []);
}
