import { Fragment } from "react";
import AdSlot from "@/components/ads/AdSlot";
import { SearchProfile } from "@/lib/search";
import EmptyProfilesState from "@/components/home/EmptyProfilesState";
import ProfileCard from "@/components/home/ProfileCard";
import { ADS_SLOTS } from "@/lib/adsConfig";

type ProfilesGridProps = {
  profiles: SearchProfile[];
};

export default function ProfilesGrid({ profiles }: ProfilesGridProps) {
  return (
    <>
      <section className="mt-6 grid w-full grid-cols-1 gap-4">
        {profiles.length === 0 ? (
          <EmptyProfilesState />
        ) : (
          profiles.flatMap((profile, index) => {
            const cards: React.ReactNode[] = [<ProfileCard key={profile.userId} profile={profile} />];

            if ((index + 1) % 4 === 0) {
              cards.push(
                <div key={`mobile-inline-ad-${index}`} className="col-span-full sm:hidden">
                  <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
                    <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
                    <AdSlot
                      className="block min-h-[220px] w-full rounded-md bg-pink-50/50"
                      slot={ADS_SLOTS.mobileInline}
                    />
                  </div>
                </div>,
              );
            }

            return <Fragment key={`profile-fragment-${profile.userId}`}>{cards}</Fragment>;
          })
        )}
      </section>

      <div className="mt-6 sm:hidden">
        <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
          <AdSlot
            className="block min-h-[220px] w-full rounded-md bg-pink-50/50"
            slot={ADS_SLOTS.mobileBottom}
          />
        </div>
      </div>
    </>
  );
}
