"use client";

import { useEffect, useId, useRef, useState } from "react";
import SelectChevron from "@/components/ui/SelectChevron";

export type MultiSelectOption = { value: string; label: string };

type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  /** Shown in the trigger while nothing is selected. */
  placeholder: string;
  /** Maximum selections. Omit for no limit. */
  max?: number;
  /** Shown when the user tries to pick past `max`. */
  limitMessage?: string;
  /** Id of the visible label element, so the trigger button is announced with it. */
  labelledBy?: string;
};

/**
 * Dropdown with a checkbox list; selected items also show as removable chips below it.
 * At `max`, remaining options are greyed out but stay clickable — the click is what
 * surfaces the limit error, rather than the option silently doing nothing.
 */
export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  max,
  limitMessage,
  labelledBy,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [limitError, setLimitError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const atLimit = max != null && value.length >= max;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function labelFor(optionValue: string) {
    return options.find((o) => o.value === optionValue)?.label ?? optionValue;
  }

  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      setLimitError(false);
      onChange(value.filter((v) => v !== optionValue));
    } else if (atLimit) {
      setLimitError(true);
    } else {
      onChange([...value, optionValue]);
    }
  }

  const summary = !value.length
    ? placeholder
    : max != null
      ? `${value.length} of ${max} selected`
      : `${value.length} selected`;

  return (
    <div ref={rootRef}>
      <div className="relative">
        <button
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={labelledBy}
          className={`w-full cursor-pointer rounded-lg border bg-white py-2.5 pl-3 pr-9 text-left text-sm outline-none focus:border-pink-300 ${
            limitError ? "border-red-400" : "border-zinc-800"
          } ${value.length ? "text-zinc-900" : "text-zinc-400"}`}
          type="button"
          onClick={() => setOpen((o) => !o)}
        >
          {summary}
        </button>
        <SelectChevron />

        {open ? (
          <ul
            aria-labelledby={labelledBy}
            aria-multiselectable
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
            id={listId}
            role="listbox"
          >
            {options.map((opt) => {
              const selected = value.includes(opt.value);
              const disabled = !selected && atLimit;
              return (
                <li
                  aria-disabled={disabled}
                  aria-selected={selected}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                    disabled ? "text-zinc-400" : "text-zinc-900 hover:bg-pink-50"
                  }`}
                  key={opt.value}
                  role="option"
                  onClick={() => toggle(opt.value)}
                >
                  <span
                    aria-hidden
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selected ? "border-pink-500 bg-pink-500 text-white" : "border-zinc-400"
                    }`}
                  >
                    {selected ? "✓" : null}
                  </span>
                  {opt.label}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {value.length ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {value.map((selectedValue) => (
            <li
              className="flex items-center gap-1 rounded-full bg-pink-100 py-1 pl-3 pr-1 text-xs font-medium text-pink-800"
              key={selectedValue}
            >
              {labelFor(selectedValue)}
              <button
                aria-label={`Remove ${labelFor(selectedValue)}`}
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full hover:bg-pink-200"
                type="button"
                onClick={() => toggle(selectedValue)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {limitError ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {limitMessage ?? `You can select up to ${max}. Remove one to add another.`}
        </p>
      ) : null}
    </div>
  );
}
