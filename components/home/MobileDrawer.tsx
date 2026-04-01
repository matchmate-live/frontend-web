"use client";

import Link from "next/link";
import AboutIcon from "@/icons/about.svg";
import ContactIcon from "@/icons/contact.svg";
import HomeIcon from "@/icons/home.svg";
import MessagesIcon from "@/icons/messages.svg";

type MobileDrawerProps = {
  open: boolean;
  isLoggedIn: boolean;
  onLogout?: () => Promise<void> | void;
  onClose: () => void;
};

export default function MobileDrawer({ open, isLoggedIn, onLogout, onClose }: MobileDrawerProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        aria-label="Close menu backdrop"
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        type="button"
        onClick={onClose}
      />
      <aside
        id="mobile-nav-drawer"
        className={`absolute right-0 top-0 h-full w-72 border-l border-pink-200 bg-white p-4 shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
        <div className="mb-4 relative">
          <p className="text-left text-xl font-semibold text-pink-300">MatchMate.live</p>
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
          <Link
            className="flex w-full items-center gap-2 border-y border-pink-200 px-4 py-3 text-left text-sm text-zinc-900"
            href="/"
            onClick={onClose}
          >
            <HomeIcon className="h-4 w-4 text-pink-300" />
            Home
          </Link>
          <Link
            className="flex w-full items-center gap-2 border-y border-pink-200 px-4 py-3 text-left text-sm text-zinc-900"
            href="/messages"
            onClick={onClose}
          >
            <MessagesIcon className="h-4 w-4 text-pink-300" />
            Messages
          </Link>
          <Link
            className="flex w-full items-center gap-2 border-y border-pink-200 px-4 py-3 text-left text-sm text-zinc-900"
            href="/contact"
            onClick={onClose}
          >
            <ContactIcon className="h-4 w-4 text-pink-300" />
            Contact us
          </Link>
          <Link
            className="flex w-full items-center gap-2 border-y border-pink-200 px-4 py-3 text-left text-sm text-zinc-900"
            href="/about"
            onClick={onClose}
          >
            <AboutIcon className="h-4 w-4 text-pink-300" />
            About
          </Link>
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
              <Link
                className="rounded-md border border-pink-200 bg-white px-3 py-2 text-center text-sm text-zinc-900"
                href="/auth/sign-up"
                onClick={onClose}
              >
                Sign up
              </Link>
              <Link className="rounded-md bg-pink-300 px-3 py-2 text-center text-sm text-white" href="/auth/sign-in" onClick={onClose}>
                Sign in
              </Link>
            </>
          )}
        </div>
        </div>
      </aside>
    </div>
  );
}
