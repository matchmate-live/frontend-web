"use client";

import HelpTooltipIcon from "@/components/ui/HelpTooltipIcon";
import MultiSelect from "@/components/ui/MultiSelect";
import SelectChevron from "@/components/ui/SelectChevron";
import {
  BODY_TYPE_OPTIONS,
  ETHNICITY_OPTIONS,
  LIKE_OPTIONS,
  MAX_LIKES,
  MIN_SEEKING_AGE,
  RACE_OPTIONS,
  type ProfileDetailsErrors,
  type ProfileDetailsForm,
} from "@/lib/profileDetails";

type ProfileDetailsFieldsProps = {
  value: ProfileDetailsForm;
  onChange: (next: ProfileDetailsForm) => void;
  errors: ProfileDetailsErrors;
  /** Keeps element ids unique on the page. */
  idPrefix: string;
};

const labelClass = "mb-1 block text-sm font-medium text-zinc-600";
// Shared by the selects and number inputs so they all look the same.
const fieldClass =
  "w-full rounded-lg border bg-white py-2.5 pl-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-pink-300";

// Digits-only text input instead of type="number": no spinner arrows, but phones still show
// the number keypad. Ranges are checked in validateProfileDetails.
function NumberInput({
  id,
  value,
  onChange,
  placeholder,
  ariaLabel,
  suffix,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  suffix?: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <input
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        className={`${fieldClass} ${suffix ? "pr-10" : "pr-3"} ${invalid ? "border-red-400" : "border-zinc-800"}`}
        id={id}
        inputMode="numeric"
        maxLength={3}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

function OptionSelect({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select
          className={`${fieldClass} appearance-none border-zinc-800 pr-9`}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Prefer not to say</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <SelectChevron />
      </div>
    </div>
  );
}

// The optional "about me" fields, used in onboarding and Settings.
export default function ProfileDetailsFields({ value, onChange, errors, idPrefix }: ProfileDetailsFieldsProps) {
  function set<K extends keyof ProfileDetailsForm>(key: K, next: ProfileDetailsForm[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className={`${labelClass} flex items-center gap-1.5`} id={`${idPrefix}-likes-label`}>
          Likes
          <HelpTooltipIcon text={`You can select up to ${MAX_LIKES} likes.`} />
        </p>
        <MultiSelect
          labelledBy={`${idPrefix}-likes-label`}
          limitMessage={`You can select a maximum of ${MAX_LIKES} likes. Remove one to add another.`}
          max={MAX_LIKES}
          options={LIKE_OPTIONS}
          placeholder="What are you into?"
          value={value.likes}
          onChange={(likes) => set("likes", likes)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <OptionSelect
          id={`${idPrefix}-ethnicity`}
          label="Ethnicity"
          options={ETHNICITY_OPTIONS}
          value={value.ethnicity}
          onChange={(v) => set("ethnicity", v)}
        />
        <OptionSelect
          id={`${idPrefix}-race`}
          label="Race"
          options={RACE_OPTIONS}
          value={value.race}
          onChange={(v) => set("race", v)}
        />
        <OptionSelect
          id={`${idPrefix}-body-type`}
          label="Body type"
          options={BODY_TYPE_OPTIONS}
          value={value.bodyType}
          onChange={(v) => set("bodyType", v)}
        />
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-height`}>
            Height
          </label>
          <NumberInput
            id={`${idPrefix}-height`}
            invalid={Boolean(errors.heightCm)}
            placeholder="e.g. 170"
            suffix="cm"
            value={value.heightCm}
            onChange={(v) => set("heightCm", v)}
          />
          {errors.heightCm ? <p className="mt-1 text-xs text-red-600">{errors.heightCm}</p> : null}
        </div>
      </div>

      <div role="group" aria-labelledby={`${idPrefix}-seeking-label`}>
        <p className={labelClass} id={`${idPrefix}-seeking-label`}>
          I&apos;d like to meet someone aged
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <NumberInput
            ariaLabel="From age"
            id={`${idPrefix}-seeking-min`}
            invalid={Boolean(errors.seekingAge)}
            placeholder={`From (${MIN_SEEKING_AGE})`}
            value={value.seekingAgeMin}
            onChange={(v) => set("seekingAgeMin", v)}
          />
          <span className="text-sm text-zinc-600">to</span>
          <NumberInput
            ariaLabel="To age"
            id={`${idPrefix}-seeking-max`}
            invalid={Boolean(errors.seekingAge)}
            placeholder="To (any)"
            value={value.seekingAgeMax}
            onChange={(v) => set("seekingAgeMax", v)}
          />
        </div>
        {errors.seekingAge ? (
          <p className="mt-1 text-xs text-red-600">{errors.seekingAge}</p>
        ) : (
          <p className="mt-1 text-xs text-zinc-500">Open to any age? Just leave either one blank.</p>
        )}
      </div>
    </div>
  );
}
