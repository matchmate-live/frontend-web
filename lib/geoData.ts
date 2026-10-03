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

const cityRequests = new Map<string, Promise<string[]>>();

// City names for a country, fetched once per page load. Returns [] for an unknown country
// or a failed request (failures are retried next time).
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
