"use client";

type BackButtonProps = {
  onClick: () => void;
  label?: string;
};

export default function BackButton({ onClick, label = "" }: BackButtonProps) {
  return (
    <button
      aria-label={label}
      className="-ml-2 flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full px-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-pink-50 hover:text-pink-600"
      type="button"
      onClick={onClick}
    >
      <svg aria-hidden className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  );
}
