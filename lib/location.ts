export function titleCase(input?: string) {
  if (!input) return "";
  return input
    .split(" ")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function guessCountryFromTimezone(): string | undefined {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!timeZone || !timeZone.includes("/")) return undefined;

  const zone = timeZone.toLowerCase();
  const map: Record<string, string> = {
    "asia/kolkata": "india",
    "asia/karachi": "pakistan",
    "asia/dhaka": "bangladesh",
    "asia/kathmandu": "nepal",
    "asia/dubai": "united arab emirates",
    "asia/singapore": "singapore",
    "asia/bangkok": "thailand",
    "asia/jakarta": "indonesia",
    "asia/manila": "philippines",
    "asia/tokyo": "japan",
    "asia/seoul": "south korea",
    "asia/shanghai": "china",
    "asia/hong_kong": "hong kong",
    "asia/tehran": "iran",
    "europe/london": "united kingdom",
    "europe/paris": "france",
    "europe/berlin": "germany",
    "europe/madrid": "spain",
    "europe/rome": "italy",
    "europe/amsterdam": "netherlands",
    "europe/warsaw": "poland",
    "europe/moscow": "russia",
    "america/new_york": "united states",
    "america/chicago": "united states",
    "america/denver": "united states",
    "america/los_angeles": "united states",
    "america/toronto": "canada",
    "america/vancouver": "canada",
    "america/mexico_city": "mexico",
    "america/sao_paulo": "brazil",
    "america/buenos_aires": "argentina",
    "australia/sydney": "australia",
    "australia/melbourne": "australia",
    "pacific/auckland": "new zealand",
    "africa/cairo": "egypt",
    "africa/johannesburg": "south africa",
    "africa/lagos": "nigeria",
  };

  return map[zone];
}

export async function reverseGeocode(lat: number, lon: number): Promise<{ country?: string; city?: string }> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) return {};

  const payload = (await response.json()) as {
    address?: { country?: string; city?: string; town?: string; village?: string };
  };

  const city = payload.address?.city ?? payload.address?.town ?? payload.address?.village;
  return {
    country: payload.address?.country,
    city,
  };
}
