"use client";

import { useEffect, useState } from "react";
import { FilterState } from "@/lib/search";
import { titleCase } from "@/lib/location";
import { useModalA11y } from "@/hooks/useModalA11y";
import SelectChevron from "@/components/ui/SelectChevron";

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

/**
 * Raw text the user is typing, separate from the committed numeric value — otherwise
 * clearing the field to type a new number snaps straight back to the default on every
 * keystroke, since Number("") is 0 and `0 || fallback` treats that the same as empty.
 * Re-syncs from `committedValue` only when `open` flips true (dialog reopened), not on
 * every parent update caused by this hook's own `onCommit` calls.
 */
function useAgeFieldText(committedValue: number, open: boolean, fallback: number, onCommit: (value: number) => void) {
  const [text, setText] = useState(String(committedValue));

  useEffect(() => {
    if (open) setText(String(committedValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setText(value);
    const parsed = Number(value);
    if (value.trim() !== "" && Number.isFinite(parsed)) {
      onCommit(parsed);
    }
  }

  function onBlur() {
    const parsed = Number(text);
    const value = text.trim() !== "" && Number.isFinite(parsed) ? parsed : fallback;
    setText(String(value));
    onCommit(value);
  }

  return { text, onChange, onBlur };
}

export default function FilterDialog({
  open,
  draftFilters,
  countries,
  cityOptions,
  onClose,
  onDraftChange,
  onApply,
}: FilterDialogProps) {
  const minAgeField = useAgeFieldText(draftFilters.minAge, open, 18, (minAge) =>
    onDraftChange({ ...draftFilters, minAge }),
  );
  const maxAgeField = useAgeFieldText(draftFilters.maxAge, open, 40, (maxAge) =>
    onDraftChange({ ...draftFilters, maxAge }),
  );
  const dialogRef = useModalA11y<HTMLDivElement>(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/25 p-4">
      <div
        ref={dialogRef}
        aria-labelledby="filter-dialog-title"
        aria-modal="true"
        className="mx-auto mt-14 w-full max-w-md rounded-xl border border-pink-200 bg-white p-4 shadow-lg"
        role="dialog"
      >
        <h3 className="text-lg font-semibold text-zinc-900" id="filter-dialog-title">
          Filters
        </h3>

        <label className="mt-4 block text-sm text-zinc-700">Min age</label>
        <input
          className="mt-1 w-full rounded-md border border-pink-200 p-2 text-sm"
          max={draftFilters.maxAge}
          min={18}
          type="number"
          value={minAgeField.text}
          onChange={minAgeField.onChange}
          onBlur={minAgeField.onBlur}
        />

        <label className="mt-3 block text-sm text-zinc-700">Max age</label>
        <input
          className="mt-1 w-full rounded-md border border-pink-200 p-2 text-sm"
          max={100}
          min={draftFilters.minAge}
          type="number"
          value={maxAgeField.text}
          onChange={maxAgeField.onChange}
          onBlur={maxAgeField.onBlur}
        />

        <label className="mt-3 block text-sm text-zinc-700">Country</label>
        <div className="relative mt-1">
          <select
            className="w-full appearance-none rounded-md border border-pink-200 py-2 pl-2 pr-9 text-sm"
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
          <SelectChevron />
        </div>

        <label className="mt-3 block text-sm text-zinc-700">City</label>
        <div className="relative mt-1">
          <select
            className="w-full appearance-none rounded-md border border-pink-200 py-2 pl-2 pr-9 text-sm"
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
          <SelectChevron />
        </div>

        <label className="mt-3 block text-sm text-zinc-700">Gender</label>
        <div className="relative mt-1">
          <select
            className="w-full appearance-none rounded-md border border-pink-200 py-2 pl-2 pr-9 text-sm"
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
          <SelectChevron />
        </div>

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
