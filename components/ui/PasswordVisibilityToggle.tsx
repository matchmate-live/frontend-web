"use client";

type PasswordVisibilityToggleProps = {
  visible: boolean;
  onToggle: () => void;
};

export default function PasswordVisibilityToggle({ visible, onToggle }: PasswordVisibilityToggleProps) {
  return (
    <button
      aria-label={visible ? "Hide password" : "Show password"}
      className="flex h-4 w-4 cursor-pointer items-center justify-center text-zinc-500 hover:text-zinc-700"
      type="button"
      onClick={onToggle}
    >
      {visible ? (
        <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M3 3l18 18" strokeLinecap="round" />
          <path
            d="M9.88 5.09A10.9 10.9 0 0 1 12 5c5 0 9 4 10 7-.42 1.25-1.2 2.6-2.3 3.78M6.6 6.6C4.5 8 3.1 10 2 12c1 3 5 7 10 7 1.36 0 2.62-.28 3.75-.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
