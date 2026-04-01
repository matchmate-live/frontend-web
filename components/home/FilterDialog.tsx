"use client";

import { FilterState } from "@/lib/search";
import { titleCase } from "@/lib/location";

type CountryOption = {
  value: string;
  label: string;
  isoCode: string;
};

type FilterDialogProps = {
  open: boolean;
  draftFilters: FilterState;
  countries: CountryOption[];
  cityOptions: string[];
  onClose: () => void;
  onDraftChange: (next: FilterState) => void;
  onApply: () => void;
};

export default function FilterDialog({
  open,
  draftFilters,
  countries,
  cityOptions,
  onClose,
  onDraftChange,
  onApply,
}: FilterDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/25 p-4">
      <div className="mx-auto mt-14 w-full max-w-md rounded-xl border border-pink-200 bg-white p-4 shadow-lg">
        <h3 className="text-lg font-semibold text-zinc-900">Filters</h3>

        <label className="mt-4 block text-sm text-zinc-700">Min age</label>
        <input
          className="mt-1 w-full rounded-md border border-pink-200 p-2 text-sm"
          max={draftFilters.maxAge}
          min={18}
          type="number"
          value={draftFilters.minAge}
          onChange={(e) =>
            onDraftChange({ ...draftFilters, minAge: Number(e.target.value) || 18 })
          }
        />

        <label className="mt-3 block text-sm text-zinc-700">Max age</label>
        <input
          className="mt-1 w-full rounded-md border border-pink-200 p-2 text-sm"
          max={100}
          min={draftFilters.minAge}
          type="number"
          value={draftFilters.maxAge}
          onChange={(e) =>
            onDraftChange({ ...draftFilters, maxAge: Number(e.target.value) || 40 })
          }
        />

        <label className="mt-3 block text-sm text-zinc-700">Country</label>
        <select
          className="mt-1 w-full rounded-md border border-pink-200 p-2 text-sm"
          value={draftFilters.country}
          onChange={(e) =>
            onDraftChange({
              ...draftFilters,
              country: e.target.value,
              city: "",
            })
          }
        >
          <option value="">Select country</option>
          {countries.map((country) => (
            <option key={country.isoCode} value={country.value}>
              {country.label}
            </option>
          ))}
        </select>

        <label className="mt-3 block text-sm text-zinc-700">City</label>
        <select
          className="mt-1 w-full rounded-md border border-pink-200 p-2 text-sm"
          disabled={!draftFilters.country}
          value={draftFilters.city}
          onChange={(e) => onDraftChange({ ...draftFilters, city: e.target.value })}
        >
          <option value="">All cities</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {titleCase(city)}
            </option>
          ))}
        </select>

        <label className="mt-3 block text-sm text-zinc-700">Gender</label>
        <select
          className="mt-1 w-full rounded-md border border-pink-200 p-2 text-sm"
          value={draftFilters.gender}
          onChange={(e) =>
            onDraftChange({
              ...draftFilters,
              gender: e.target.value as "male" | "female",
            })
          }
        >
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button className="rounded-md border border-pink-200 bg-white px-3 py-1.5 text-sm text-zinc-900" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rounded-md bg-pink-500 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!draftFilters.country}
            type="button"
            onClick={onApply}
          >
            Apply
          </button>
        </div>
        {!draftFilters.country ? (
          <p className="mt-2 text-right text-xs text-zinc-600">Please select a country to apply filters.</p>
        ) : null}
      </div>
    </div>
  );
}
