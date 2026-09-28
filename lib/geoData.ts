// Deep import on purpose: the package root also pulls in the ~8 MB city dataset. Cities
// are served per country by app/api/geo/cities/[isoCode] instead (see fetchCityOptions).
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

const cityRequests = new Map<string, Promise<string[]>>();

/** Lowercase city names for `countryValue` (country name lowercased). Same data home
 * filters and onboarding use. Fetched once per country per page load; resolves to [] for an
 * unknown country or a failed request (a failure isn't cached, so it's retried next time). */
export function fetchCityOptions(countryValue: string): Promise<string[]> {
  if (!countryValue) return Promise.resolve([]);
  const country = Country.getAllCountries().find(
    (item) => item.name.toLowerCase() === countryValue.toLowerCase(),
  );
  if (!country) return Promise.resolve([]);

  let request = cityRequests.get(country.isoCode);
  if (!request) {
    request = fetch(`/api/geo/cities/${country.isoCode}`)
      .then((res) => {
        if (!res.ok) throw new Error(`City list request failed (${res.status})`);
        return res.json() as Promise<string[]>;
      })
      .catch(() => {
        cityRequests.delete(country.isoCode);
        return [];
      });
    cityRequests.set(country.isoCode, request);
  }
  return request;
}
