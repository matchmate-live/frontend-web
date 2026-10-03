import City from "country-state-city/lib/city";
import Country from "country-state-city/lib/country";

// Some countries have tens of thousands of cities, far too many for a dropdown.
const MAX_CITY_OPTIONS = 1000;

// The city data is about 8 MB, so it stays out of the browser bundle. Each country's list
// is built at build time and served as a static file; unknown codes return 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return Country.getAllCountries().map((country) => ({ isoCode: country.isoCode }));
}

// Sorted, lowercase, de-duplicated city names for one country.
export async function GET(_request: Request, { params }: RouteContext<"/api/geo/cities/[isoCode]">) {
  const { isoCode } = await params;
  const rawCities = City.getCitiesOfCountry(isoCode) ?? [];
  const cities = [...new Set(rawCities.map((city) => city.name.toLowerCase()))]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_CITY_OPTIONS);
  return Response.json(cities);
}
