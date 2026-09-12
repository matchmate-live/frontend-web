"use client";

type FloatingInputProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  /** For `type="date"`, ISO YYYY-MM-DD bounds (browser-native constraint). */
  min?: string;
  max?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  error?: string;
};

export default function FloatingInput({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  required = false,
  min,
  max,
  startAdornment,
  endAdornment,
  error,
}: FloatingInputProps) {
  const hasStart = Boolean(startAdornment);
  const hasEnd = Boolean(endAdornment);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          className={`peer w-full rounded-md border ${
            error ? "border-red-500" : "border-zinc-700"
          } bg-white pb-2 pt-5 text-zinc-900 outline-none transition focus:border-pink-400 ${
            hasStart ? "pl-10" : "pl-3"
          } ${hasEnd ? "pr-10" : "pr-3"}`}
          placeholder=" "
          required={required}
          type={type}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        <label className={`pointer-events-none absolute top-1/2 -translate-y-1/2 bg-white px-1 text-sm text-zinc-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-0.5 peer-focus:text-xs peer-not-placeholder-shown:top-0.5 peer-not-placeholder-shown:text-xs ${
          hasStart ? "left-10" : "left-3"
        }`}>
          {label}
        </label>

        {hasStart ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">{startAdornment}</span>
        ) : null}
        {hasEnd ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{endAdornment}</span>
        ) : null}
      </div>
      <div aria-live="polite" className={error ? "mt-1" : undefined}>
        {error ? <p className="text-xs leading-snug text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
