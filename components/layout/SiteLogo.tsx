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
