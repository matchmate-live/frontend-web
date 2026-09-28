import City from "country-state-city/lib/city";
import Country from "country-state-city/lib/country";

/** Cap per country — some (e.g. US, IN) have tens of thousands of entries, far more than a
 * <select> can usefully show. */
const MAX_CITY_OPTIONS = 1000;

// The city dataset is ~8 MB, so it lives here instead of in the client bundle. Every
// country's list is prerendered at build time and served as a static file (no function
// invocation); unknown codes 404 rather than rendering on demand.
export const dynamicParams = false;

export function generateStaticParams() {
  return Country.getAllCountries().map((country) => ({ isoCode: country.isoCode }));
}

/** Lowercase, de-duplicated, sorted city names for one country (by ISO code). */
export async function GET(_request: Request, { params }: RouteContext<"/api/geo/cities/[isoCode]">) {
  const { isoCode } = await params;
  const rawCities = City.getCitiesOfCountry(isoCode) ?? [];
  const cities = [...new Set(rawCities.map((city) => city.name.toLowerCase()))]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_CITY_OPTIONS);
  return Response.json(cities);
}
