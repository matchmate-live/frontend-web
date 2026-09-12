/**
 * DynamoDB profile keys (normalized lowercase), format:
 * - `locationGender`: `country#city#gender`
 * - `countryGender`: `country#gender`
 */
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

export function formatLastSeenStatus(epochMs: number): string {
  const d = new Date(epochMs);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
