// Search key formats (lowercase): locationGender is country#city#gender, countryGender is
// country#gender.
export function parseLocationGender(
  key: string | undefined,
): { country: string; city: string; gender: string } | null {
  if (!key?.trim()) return null;
  const parts = key.trim().split("#");
  if (parts.length !== 3) return null;
  const [country, city, gender] = parts;
  if (!country || !city || !gender) return null;
  return { country, city, gender };
}

export function parseCountryGender(key: string | undefined): { country: string; gender: string } | null {
  if (!key?.trim()) return null;
  const parts = key.trim().split("#");
  if (parts.length !== 2) return null;
  const [country, gender] = parts;
  if (!country || !gender) return null;
  return { country, gender };
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}

// Short "time ago" text for search cards, e.g. "5 minutes ago", "2 weeks ago".
// A month is 30 days and a year 365, close enough here.
export function formatTimeAgo(epochMs: number, now: number = Date.now()): string {
  if (!Number.isFinite(epochMs)) return "—";
  const diff = Math.max(0, now - epochMs);
  if (diff < MINUTE_MS) return "just now";
  if (diff < HOUR_MS) return plural(Math.floor(diff / MINUTE_MS), "minute");
  if (diff < DAY_MS) return plural(Math.floor(diff / HOUR_MS), "hour");
  const days = Math.floor(diff / DAY_MS);
  if (days < 7) return plural(days, "day");
  if (days < 30) return plural(Math.floor(days / 7), "week");
  if (days < 365) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}

export function formatLastSeenStatus(epochMs: number): string {
  const d = new Date(epochMs);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
