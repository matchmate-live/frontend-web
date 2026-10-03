import type { ProfileResponse } from "@/lib/onboarding";
import {
  BODY_TYPE_OPTIONS,
  ETHNICITY_OPTIONS,
  LIKE_OPTIONS,
  RACE_OPTIONS,
  formatHeight,
  formatSeekingAgeRange,
  optionLabel,
} from "@/lib/profileDetails";

// The about-me details on a profile page. Shows nothing if none are set.
export default function ProfileDetailsSummary({ profile }: { profile: ProfileResponse }) {
  const rows = [
    { label: "Height", value: profile.heightCm != null ? formatHeight(profile.heightCm) : undefined },
    { label: "Body type", value: optionLabel(BODY_TYPE_OPTIONS, profile.bodyType) },
    { label: "Ethnicity", value: optionLabel(ETHNICITY_OPTIONS, profile.ethnicity) },
    { label: "Race", value: optionLabel(RACE_OPTIONS, profile.race) },
    { label: "Looking for someone aged", value: formatSeekingAgeRange(profile.seekingAgeMin, profile.seekingAgeMax) },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  // Skip values we don't recognise (e.g. a removed option).
  const likes = (profile.likes ?? [])
    .map((like) => optionLabel(LIKE_OPTIONS, like))
    .filter((label): label is string => Boolean(label));

  if (rows.length === 0 && likes.length === 0) return null;

  return (
    <div className="space-y-6 border-t border-pink-100 pt-6">
      {rows.length ? (
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">A bit about me</h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="text-xs text-zinc-500">{row.label}</dt>
                <dd className="text-base text-zinc-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {likes.length ? (
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">What I love</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {likes.map((like) => (
              <li className="rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-800" key={like}>
                {like}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
