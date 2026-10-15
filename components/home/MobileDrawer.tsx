"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import AboutIcon from "@/icons/about.svg";
import ContactIcon from "@/icons/contact.svg";
import HomeIcon from "@/icons/home.svg";
import MessagesIcon from "@/icons/messages.svg";
import SettingsIcon from "@/icons/user-round.svg";
import SiteLogo from "@/components/layout/SiteLogo";
import { useModalA11y } from "@/hooks/useModalA11y";
import LinkPendingIcon from "@/components/ui/LinkPendingIcon";

type MobileDrawerProps = {
  open: boolean;
  isLoggedIn: boolean;
  onLogout?: () => Promise<void> | void;
  onClose: () => void;
};

type DrawerLinkProps = {
  href: string;
  className: string;
  onClose: () => void;
  children: React.ReactNode;
};

// Menu link that leaves the menu open, with a spinner on the tapped item (LinkPendingIcon),
// until the next page replaces this one. A link to the page already shown navigates nowhere,
// so it closes the menu right away.
function DrawerLink({ href, className, onClose, children }: DrawerLinkProps) {
  const pathname = usePathname();
  return (
    <Link
      prefetch={false}
      className={className}
      href={href}
      onClick={() => {
        if (href === pathname) onClose();
      }}
    >
      {children}
    </Link>
  );
}

export default function MobileDrawer({ open, isLoggedIn, onLogout, onClose }: MobileDrawerProps) {
  const drawerRef = useModalA11y<HTMLDivElement>(open, onClose);

  // Usually the new page unmounts this menu. If it's ever kept (e.g. a shared layout), close
  // it once the path changes so it doesn't stay open over the new page.
  const pathname = usePathname();
  const openedOnPathRef = useRef(pathname);
  useEffect(() => {
    if (!open) {
      openedOnPathRef.current = pathname;
    } else if (pathname !== openedOnPathRef.current) {
      onClose();
    }
  }, [open, pathname, onClose]);

  return (
    <div
      ref={drawerRef}
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      // Stays mounted for the slide animation; inert keeps it unreachable while closed.
      inert={!open}
    >
      <button
        aria-label="Close menu backdrop"
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        type="button"
        onClick={onClose}
      />
      <aside
        aria-label="Navigation menu"
        aria-modal="true"
        id="mobile-nav-drawer"
        role="dialog"
        className={`absolute right-0 top-0 h-full w-72 border-l border-pink-200 bg-white p-4 shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
        <div className="mb-4 relative">
          <SiteLogo className="flex text-left text-xl" iconClassName="h-6 w-6" />
          <button
            aria-label="Close menu"
            className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer rounded-md border border-pink-200 p-2 text-pink-300"
            type="button"
            onClick={onClose}
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
        <div className="mx-[-1rem]">
          <DrawerLink
            className="flex w-full items-center gap-2 border-y border-pink-200 px-4 py-3 text-left text-sm text-zinc-900"
            href="/"
            onClose={onClose}
          >
            <LinkPendingIcon className="h-4 w-4">
              <HomeIcon className="h-4 w-4 text-pink-300" />
            </LinkPendingIcon>
            Home
          </DrawerLink>
          <DrawerLink
            className="flex w-full items-center gap-2 border-y border-pink-200 px-4 py-3 text-left text-sm text-zinc-900"
            href="/messages"
            onClose={onClose}
          >
            <LinkPendingIcon className="h-4 w-4">
              <MessagesIcon className="h-4 w-4 text-pink-300" />
            </LinkPendingIcon>
            Messages
          </DrawerLink>
          <DrawerLink
            className="flex w-full items-center gap-2 border-y border-pink-200 px-4 py-3 text-left text-sm text-zinc-900"
            href="/settings"
            onClose={onClose}
          >
            <LinkPendingIcon className="h-4 w-4">
              <SettingsIcon className="h-4 w-4 text-pink-300" />
            </LinkPendingIcon>
            Profile settings
          </DrawerLink>
          <DrawerLink
            className="flex w-full items-center gap-2 border-y border-pink-200 px-4 py-3 text-left text-sm text-zinc-900"
            href="/contact"
            onClose={onClose}
          >
            <LinkPendingIcon className="h-4 w-4">
              <ContactIcon className="h-4 w-4 text-pink-300" />
            </LinkPendingIcon>
            Contact us
          </DrawerLink>
          <DrawerLink
            className="flex w-full items-center gap-2 border-y border-pink-200 px-4 py-3 text-left text-sm text-zinc-900"
            href="/about"
            onClose={onClose}
          >
            <LinkPendingIcon className="h-4 w-4">
              <AboutIcon className="h-4 w-4 text-pink-300" />
            </LinkPendingIcon>
            About
          </DrawerLink>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          {isLoggedIn ? (
            <button
              className="cursor-pointer rounded-md bg-pink-300 px-3 py-2 text-center text-sm text-white"
              type="button"
              onClick={async () => {
                await onLogout?.();
                onClose();
              }}
            >
              Logout
            </button>
          ) : (
            <>
              <DrawerLink
                className="relative rounded-md border border-pink-200 bg-white px-3 py-2 text-center text-sm text-zinc-900"
                href="/auth/sign-up"
                onClose={onClose}
              >
                Sign up
                <LinkPendingIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              </DrawerLink>
              <DrawerLink
                className="relative rounded-md bg-pink-300 px-3 py-2 text-center text-sm text-white"
                href="/auth/sign-in"
                onClose={onClose}
              >
                Sign in
                <LinkPendingIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              </DrawerLink>
            </>
          )}
        </div>
        </div>
      </aside>
    </div>
  );
}
