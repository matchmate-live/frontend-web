"use client";

import { FilterState } from "@/lib/search";
import { titleCase } from "@/lib/location";

type FilterBarProps = {
  filters: FilterState;
  hasRequestedLocation: boolean;
  onOpenFilters: () => void;
  onAllowLocation: () => void;
};

export default function FilterBar({
  filters,
  hasRequestedLocation,
  onOpenFilters,
  onAllowLocation,
}: FilterBarProps) {
  return (
    <section className="mt-2 flex flex-wrap items-center gap-2">
      <button className="rounded-md border border-pink-200 bg-white px-3 py-1.5 text-sm text-zinc-900" type="button" onClick={onOpenFilters}>
        Age: {filters.minAge}-{filters.maxAge}
      </button>
      <button className="rounded-md border border-pink-200 bg-white px-3 py-1.5 text-sm text-zinc-900" type="button" onClick={onOpenFilters}>
        Country: {filters.country ? titleCase(filters.country) : "Select"}
      </button>
      <button className="rounded-md border border-pink-200 bg-white px-3 py-1.5 text-sm text-zinc-900" type="button" onClick={onOpenFilters}>
        City: {filters.city ? titleCase(filters.city) : "All cities"}
      </button>
      <button className="rounded-md border border-pink-200 bg-white px-3 py-1.5 text-sm text-zinc-900" type="button" onClick={onOpenFilters}>
        Gender: {titleCase(filters.gender)}
      </button>
      {!hasRequestedLocation ? (
        <button className="rounded-md bg-pink-500 px-4 py-1.5 text-sm font-medium text-white" type="button" onClick={onAllowLocation}>
          Allow location
        </button>
      ) : null}
    </section>
  );
}
