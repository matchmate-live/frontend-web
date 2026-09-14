"use client";

import SiteLogo from "@/components/layout/SiteLogo";

type HomeNavbarProps = {
  menuOpen: boolean;
  onToggleMenu: () => void;
};

export default function HomeNavbar({ menuOpen, onToggleMenu }: HomeNavbarProps) {
  return (
    <nav className="w-full border-b border-pink-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <SiteLogo className="flex text-xl" href="/" iconClassName="h-7 w-7" />

        <button
          aria-controls="mobile-nav-drawer"
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          className="cursor-pointer rounded-md border border-pink-200 bg-white p-2 text-zinc-900"
          type="button"
          onClick={onToggleMenu}
        >
          <span className="block h-0.5 w-5 bg-zinc-900" />
          <span className="mt-1 block h-0.5 w-5 bg-zinc-900" />
          <span className="mt-1 block h-0.5 w-5 bg-zinc-900" />
        </button>
      </div>
    </nav>
  );
}
