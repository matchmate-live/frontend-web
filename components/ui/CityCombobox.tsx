"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import SelectChevron from "@/components/ui/SelectChevron";
import type { CityOptions } from "@/hooks/useCityOptions";
import { titleCase } from "@/lib/location";

// Large countries have 10,000+ cities, so only this many matches are rendered at once.
const MAX_VISIBLE_OPTIONS = 50;

type CityComboboxProps = {
  /** From useCityOptions(): the lowercase city names and whether they've loaded. */
  cityOptions: CityOptions;
  /** Selected city (lowercase), or "" for none. */
  value: string;
  onChange: (city: string) => void;
  disabled?: boolean;
  placeholder: string;
  /** When set, the list starts with this option, which clears the value (e.g. "All cities"). */
  emptyOptionLabel?: string;
  /**
   * Some countries have no cities in the data. When true, users there can type their city
   * instead (onboarding needs one); otherwise there's nothing to pick.
   */
  allowTypedCity?: boolean;
  id?: string;
  /** Classes for the text input, so it matches the form's other fields. */
  inputClassName: string;
};

// Cities that start with the query first, then cities that contain it. `total` counts every
// match, so the list can say when it's showing only some of them.
function matchCities(options: string[], query: string): { cities: string[]; total: number } {
  const q = query.trim().toLowerCase();
  if (!q) return { cities: options.slice(0, MAX_VISIBLE_OPTIONS), total: options.length };
  const starts: string[] = [];
  const contains: string[] = [];
  let total = 0;
  for (const city of options) {
    if (city.startsWith(q)) {
      total++;
      if (starts.length < MAX_VISIBLE_OPTIONS) starts.push(city);
    } else if (city.includes(q)) {
      total++;
      if (contains.length < MAX_VISIBLE_OPTIONS) contains.push(city);
    }
  }
  return { cities: [...starts, ...contains].slice(0, MAX_VISIBLE_OPTIONS), total };
}

// Type-to-search city picker. Only listed cities can be picked (or any typed city when
// allowTypedCity applies); leaving the field with unmatched text puts the last city back.
export default function CityCombobox({
  cityOptions,
  value,
  onChange,
  disabled,
  placeholder,
  emptyOptionLabel,
  allowTypedCity,
  id,
  inputClassName,
}: CityComboboxProps) {
  const { cities: options, status } = cityOptions;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const typed = query.trim().toLowerCase();
  // Loaded, but the data has no cities for this country.
  const noCitiesListed = status === "ready" && options.length === 0;
  const typedCityAllowed = !!allowTypedCity && noCitiesListed;

  const { cities: matches, total: matchCount } = useMemo(
    () => (open ? matchCities(options, query) : { cities: [], total: 0 }),
    [open, options, query],
  );
  // The "All cities" style option is only offered while nothing is typed.
  const showEmptyOption = emptyOptionLabel != null && !typed;
  const pickable = typedCityAllowed ? (typed ? [typed] : []) : matches;
  const items: string[] = showEmptyOption ? ["", ...pickable] : pickable;
  const hiddenCount = matchCount - matches.length;

  function commitAndClose() {
    if (!open) return;
    if (typed && typed !== value && (typedCityAllowed || options.includes(typed))) onChange(typed);
    setOpen(false);
  }

  // Re-registered as the query changes, so an outside click commits what's typed now.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) commitAndClose();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, options, value, typedCityAllowed]);

  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function openList() {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }

  function pick(city: string) {
    onChange(city);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openList();
      else setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (items[activeIndex] !== undefined) pick(items[activeIndex]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  }

  // A line under the options: why there's nothing to pick, or that only some matches show.
  let note: string | null = null;
  if (status === "loading") {
    note = "Loading cities…";
  } else if (status === "error") {
    note = "Couldn't load cities.";
  } else if (noCitiesListed) {
    if (!typedCityAllowed) note = "No cities listed for this country.";
    else if (!typed) note = "No city list for this country. Type your city's name.";
  } else if (pickable.length === 0) {
    note = "No matching cities.";
  } else if (hiddenCount > 0) {
    note = `Showing ${matches.length.toLocaleString()} of ${matchCount.toLocaleString()}. ${
      typed ? "Keep typing to narrow it down." : "Type to find your city."
    }`;
  }

  const displayValue = open ? query : value ? titleCase(value) : "";

  return (
    <div className="relative" ref={rootRef}>
      <input
        aria-activedescendant={open && items.length ? `${listId}-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        autoComplete="off"
        className={inputClassName}
        disabled={disabled}
        id={id}
        placeholder={value && open ? titleCase(value) : placeholder}
        role="combobox"
        type="text"
        value={displayValue}
        onBlur={(e) => {
          if (!rootRef.current?.contains(e.relatedTarget as Node | null)) commitAndClose();
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        // Focus opens the list; click reopens it when the field kept focus after a pick.
        onClick={() => {
          if (!open) openList();
        }}
        onFocus={openList}
        onKeyDown={onKeyDown}
      />
      <SelectChevron />

      {open ? (
        <ul
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
          id={listId}
          ref={listRef}
          role="listbox"
        >
          {items.map((city, index) => (
            <li
              aria-selected={city === value}
              className={`cursor-pointer px-3 py-2 text-sm ${
                index === activeIndex ? "bg-pink-50 text-zinc-900" : "text-zinc-900"
              } ${city === value ? "font-medium" : ""}`}
              id={`${listId}-${index}`}
              key={city || "__empty"}
              role="option"
              // Keeps focus in the input so its blur doesn't close the list before the click.
              // Picking on click (not pointer down) lets touch users scroll the list.
              onClick={() => pick(city)}
              onMouseDown={(e) => e.preventDefault()}
              onPointerEnter={() => setActiveIndex(index)}
            >
              {!city ? emptyOptionLabel : typedCityAllowed ? `Use "${titleCase(city)}"` : titleCase(city)}
            </li>
          ))}
          {note ? (
            // Not an option: arrow keys skip it, and clicking it keeps the list open.
            <li
              className={`px-3 py-2 text-xs text-zinc-500 ${items.length ? "border-t border-zinc-100" : ""}`}
              role="presentation"
              onMouseDown={(e) => e.preventDefault()}
            >
              {note}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
