"use client";

import { useLinkStatus } from "next/link";

type LinkPendingIconProps = {
  /** The link's normal icon. Leave out to show only the spinner (position it via className). */
  children?: React.ReactNode;
  /** Size classes, the same as the icon's, so swapping doesn't shift the layout. */
  className: string;
};

// Put inside a <Link prefetch={false}>: shows a spinner in place of the icon from the click
// until the next page starts rendering, so the button visibly responds.
export default function LinkPendingIcon({ children, className }: LinkPendingIconProps) {
  const { pending } = useLinkStatus();
  if (!pending) return <>{children}</>;
  return (
    <span
      aria-hidden
      className={`${className} shrink-0 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500`}
    />
  );
}
