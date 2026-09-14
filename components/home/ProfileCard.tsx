import Image from "next/image";
import Link from "next/link";
import { profilePhotoSrc } from "@/lib/profilePhoto";
import {
  formatLastSeenStatus,
  parseCountryGender,
  parseLocationGender,
} from "@/lib/profileSearchDisplay";
import { SearchProfile } from "@/lib/search";
import { titleCase } from "@/lib/location";
import MessagesIcon from "@/icons/messages.svg";
import UserRoundIcon from "@/icons/user-round.svg";

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

type ProfileCardProps = {
  profile: SearchProfile;
  /** Pass true only for the first card actually above the fold — see ProfilesGrid. */
  priority?: boolean;
};

function isRecentlyOnline(lastSeen: number | undefined): boolean {
  if (typeof lastSeen !== "number" || !Number.isFinite(lastSeen)) return false;
  return Date.now() - lastSeen < ONLINE_WINDOW_MS;
}

function displayGender(profile: SearchProfile): string {
  const fromLoc = parseLocationGender(profile.locationGender);
  if (fromLoc?.gender) return titleCase(fromLoc.gender);
  const fromCountry = parseCountryGender(profile.countryGender);
  if (fromCountry?.gender) return titleCase(fromCountry.gender);
  if (profile.gender?.trim()) return titleCase(profile.gender);
  return "—";
}

/** City and country for the location line (right side). */
function displayCityCountry(profile: SearchProfile): string {
  const fromLoc = parseLocationGender(profile.locationGender);
  if (fromLoc) {
    return `${titleCase(fromLoc.city)}, ${titleCase(fromLoc.country)}`;
  }
  const fromCg = parseCountryGender(profile.countryGender);
  const cityRaw = profile.city?.trim();
  if (fromCg) {
    const cityPart = cityRaw ? titleCase(cityRaw) : "—";
    return `${cityPart}, ${titleCase(fromCg.country)}`;
  }
  const city = cityRaw ? titleCase(cityRaw) : null;
  const country = profile.country?.trim() ? titleCase(profile.country) : null;
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return "—";
}

export default function ProfileCard({ profile, priority = false }: ProfileCardProps) {
  const name = profile.name?.trim() || "Member";
  const photoSrc = profilePhotoSrc(profile.photos?.[0]);
  const genderLabel = displayGender(profile);
  const locationLine = displayCityCountry(profile);
  const online = isRecentlyOnline(profile.lastSeen);
  const statusLine = online
    ? "Status: Online"
    : typeof profile.lastSeen === "number" && Number.isFinite(profile.lastSeen)
      ? `Status: Last seen — ${formatLastSeenStatus(profile.lastSeen)}`
      : "Status: —";

  return (
    <article className="w-full overflow-hidden rounded-xl border border-pink-200 bg-white shadow-sm sm:p-4">
      <div className="flex w-full min-w-0 flex-col sm:flex-row sm:items-stretch sm:gap-4">
        {/* object-contain = full photo visible; letterboxing uses bg (no cropping like object-cover). */}
        <div className="relative mx-auto flex aspect-[5/4] w-full max-w-full min-w-0 shrink-0 items-center justify-center overflow-hidden bg-pink-50/90 sm:mx-0 sm:aspect-auto sm:h-28 sm:max-w-[7rem] sm:w-28 sm:rounded-lg">
          <Image
            alt={`${name}'s photo`}
            className="max-h-full max-w-full object-contain object-center"
            fill
            priority={priority}
            sizes="(max-width: 639px) 100vw, 112px"
            src={photoSrc}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 pb-4 pt-3 sm:min-h-28 sm:justify-between sm:gap-4 sm:p-0 sm:pt-0">
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h3 className="min-w-0 truncate text-lg font-semibold leading-snug text-zinc-900">{name}</h3>
              {profile.age != null ? (
                <span className="shrink-0 text-lg font-semibold tabular-nums text-zinc-800">{profile.age}</span>
              ) : (
                <span className="shrink-0 text-lg font-medium text-zinc-400">—</span>
              )}
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
              <span className="min-w-0 shrink font-medium text-zinc-800">{genderLabel}</span>
              <span className="min-w-0 shrink text-right text-zinc-700">{locationLine}</span>
            </div>
          </div>

          {/* Mobile: status then buttons on separate rows · sm+: one row */}
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className={`min-w-0 text-sm ${online ? "font-medium text-emerald-700" : "text-zinc-600"}`}>
              {statusLine}
            </p>
            <div className="flex w-full min-w-0 gap-2 sm:w-auto sm:flex-wrap sm:justify-end">
              <Link
                className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-pink-200 bg-white px-2.5 py-2 text-xs font-medium text-zinc-800 shadow-sm transition hover:border-pink-300 hover:bg-pink-50/80 sm:flex-initial sm:justify-start sm:py-1.5 sm:text-sm"
                href={`/messages?to=${encodeURIComponent(profile.userId)}`}
              >
                <MessagesIcon className="h-4 w-4 shrink-0 text-pink-400" aria-hidden />
                Send message
              </Link>
              <Link
                className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-pink-200 bg-white px-2.5 py-2 text-xs font-medium text-zinc-800 shadow-sm transition hover:border-pink-300 hover:bg-pink-50/80 sm:flex-initial sm:justify-start sm:py-1.5 sm:text-sm"
                href={`/profile/${encodeURIComponent(profile.userId)}`}
              >
                <UserRoundIcon className="h-4 w-4 shrink-0 text-pink-400" aria-hidden />
                See profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
