import { City, Country } from "country-state-city";

type CountryOption = {
  value: string;
  label: string;
  isoCode: string;
};

const MAX_CITY_OPTIONS = 1000;

export function getCountryOptions(): CountryOption[] {
  return Country.getAllCountries()
    .map((country) => ({
      value: country.name.toLowerCase(),
      label: country.name,
      isoCode: country.isoCode,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getCityOptionsByCountry(countryValue: string): string[] {
  if (!countryValue) return [];
  const country = Country.getAllCountries().find(
    (item) => item.name.toLowerCase() === countryValue.toLowerCase(),
  );
  if (!country) return [];

  const rawCities = City.getCitiesOfCountry(country.isoCode) ?? [];
  return [...new Set(rawCities.map((city) => city.name.toLowerCase()))]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_CITY_OPTIONS);
}
