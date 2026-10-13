import City from "country-state-city/lib/city";
import Country from "country-state-city/lib/country";

// The city data is about 8 MB, so it stays out of the browser bundle. Each country's list
// is built at build time and served as a static file; unknown codes return 404.
// Browsers cache these for a year. If this output ever changes, bump CITY_LIST_VERSION in
// lib/geoData.ts so browsers fetch the new lists.
export const dynamicParams = false;

// Set here rather than in next.config.ts so only real city lists get it; a 404 or an error
// response is never cached for a year.
const CITY_LIST_CACHE_CONTROL = "public, max-age=31536000, immutable";

export function generateStaticParams() {
  return Country.getAllCountries().map((country) => ({ isoCode: country.isoCode }));
}

// Sorted, lowercase, de-duplicated city names for one country. Every city is included (the
// US has ~14,000); the pickers search the list rather than showing it all.
export async function GET(_request: Request, { params }: RouteContext<"/api/geo/cities/[isoCode]">) {
  const { isoCode } = await params;
  const rawCities = City.getCitiesOfCountry(isoCode) ?? [];
  const cities = [...new Set(rawCities.map((city) => city.name.toLowerCase()))].sort((a, b) =>
    a.localeCompare(b),
  );
  return Response.json(cities, { headers: { "Cache-Control": CITY_LIST_CACHE_CONTROL } });
}
