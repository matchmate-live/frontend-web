import type { Metadata } from "next";
import AboutNavClient from "@/components/about/AboutNavClient";
import ContactContent from "@/components/contact/ContactContent";
import AdRail from "@/components/home/AdRail";
import { ADS_SLOTS, SHOW_UTILITY_PAGE_ADS } from "@/lib/adsConfig";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact MatchMate.live for support, safety reports, and partnership inquiries related to our dating and matrimonial platform.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
      <AboutNavClient />
      <div className={`mx-auto w-full px-4 py-4 sm:px-6 sm:py-6 ${SHOW_UTILITY_PAGE_ADS ? "max-w-7xl" : "max-w-3xl"}`}>
        <div
          className={`grid items-stretch gap-6 ${
            SHOW_UTILITY_PAGE_ADS ? "lg:grid-cols-[280px_minmax(0,1fr)_280px]" : ""
          }`}
        >
          {SHOW_UTILITY_PAGE_ADS ? <AdRail slot={ADS_SLOTS.contactDesktopLeft} /> : null}
          <ContactContent />
          {SHOW_UTILITY_PAGE_ADS ? <AdRail slot={ADS_SLOTS.contactDesktopRight} /> : null}
        </div>
      </div>
    </main>
  );
}

