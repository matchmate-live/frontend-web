import VerifiedIcon from "@/icons/verified-badge.svg";

type VerifiedBadgeProps = {
  className?: string;
  iconClassName?: string;
};

export default function VerifiedBadge({ className = "", iconClassName }: VerifiedBadgeProps) {
  return (
    <span className={`group relative inline-flex ${className}`}>
      <VerifiedIcon aria-label="Email Verified" className={`h-5 w-5 text-pink-300 ${iconClassName || ""}`} role="img" />
      <span className="pointer-events-none absolute bottom-[125%] left-0 z-20 hidden whitespace-nowrap rounded-md border border-pink-200 bg-white px-2 py-1 text-[11px] text-zinc-700 shadow-md group-hover:block">
        Email Verified
      </span>
    </span>
  );
}
