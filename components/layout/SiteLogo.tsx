import Link from "next/link";
import Logo from "@/icons/logo.svg";

type SiteLogoProps = {
  /** Icon box size, e.g. "h-6 w-6" or "h-7 w-7". */
  iconClassName?: string;
  /** Controls display (flex/hidden/sm:flex etc.), text size, and any extra spacing/alignment. */
  className?: string;
  /** Renders as a link to "/" when provided; otherwise static text (e.g. inside a drawer header). */
  href?: string;
};

/**
 * The icon SVG's artwork isn't visually centered top-to-bottom relative to the row it sits
 * in next to the text, and that's imperceptible to fix via the SVG's own viewBox at this
 * render size (a few % of a ~24-28px box rounds to under a pixel) — a real CSS nudge here
 * is the part that's actually visible.
 */

export default function SiteLogo({ iconClassName = "h-6 w-6", className = "", href }: SiteLogoProps) {
  const content = (
    <>
      <Logo className={`${iconClassName} shrink-0`} aria-hidden />
      MatchMate.live
    </>
  );
  const combinedClassName = `items-center gap-2 font-semibold text-pink-300 ${className}`.trim();

  if (href) {
    return (
      <Link className={combinedClassName} href={href}>
        {content}
      </Link>
    );
  }
  return <p className={combinedClassName}>{content}</p>;
}
