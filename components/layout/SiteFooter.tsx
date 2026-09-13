import Link from "next/link";
import Logo from "@/icons/logo.svg";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-pink-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <section>
            <Link className="flex items-center gap-2 text-lg font-semibold text-pink-300" href="/">
              <Logo className="h-6 w-6 shrink-0" aria-hidden />
              MatchMate.live
            </Link>
            <p className="mt-2 text-sm text-zinc-700">
              MatchMate.live is a free dating and matrimonial platform designed to help people find meaningful,
              long-term connections and serious marriage prospects.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-800">Explore</h3>
            <nav className="mt-2 flex flex-col gap-1 text-sm">
              <Link className="text-zinc-700 hover:text-pink-300" href="/">
                Home
              </Link>
              <Link className="text-zinc-700 hover:text-pink-300" href="/about">
                About
              </Link>
              <Link className="text-zinc-700 hover:text-pink-300" href="/contact">
                Contact us
              </Link>
              <Link className="text-zinc-700 hover:text-pink-300" href="/messages">
                Messages
              </Link>
            </nav>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-800">Why MatchMate.live</h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-700">
              <li>Free to use and ad-supported</li>
              <li>Country and city-based profile discovery</li>
              <li>Built for dating and matrimonial goals</li>
              <li>Privacy-first account approach</li>
            </ul>
          </section>
        </div>

        <div className="mt-6 border-t border-pink-100 pt-4 text-xs text-zinc-600">
          <p>
            © {year} MatchMate.live. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

