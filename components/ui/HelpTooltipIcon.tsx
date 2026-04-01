"use client";

type HelpTooltipIconProps = {
  text: string;
  className?: string;
};

export default function HelpTooltipIcon({ text, className = "" }: HelpTooltipIconProps) {
  return (
    <span className={`group relative inline-flex ${className}`}>
      <span
        aria-label="Help"
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-700 text-[10px] text-zinc-700"
      >
        ?
      </span>
      <span className="pointer-events-none absolute bottom-[125%] left-1/2 z-20 hidden w-56 -translate-x-1/2 rounded-md border border-pink-200 bg-white p-2 text-[11px] text-zinc-700 shadow-md group-hover:block">
        {text}
      </span>
    </span>
  );
}
