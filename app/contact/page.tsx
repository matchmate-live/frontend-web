import type { Metadata } from "next";
import AboutNavClient from "@/components/about/AboutNavClient";
import ContactContent from "@/components/contact/ContactContent";
import AdRail from "@/components/home/AdRail";
import { ADS_SLOTS } from "@/lib/adsConfig";

export const metadata: Metadata = {
  title: "Contact MatchMate.live",
  description:
    "Contact MatchMate.live for support, safety reports, and partnership inquiries related to our dating and matrimonial platform.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
      <AboutNavClient />
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid items-stretch gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <AdRail slot={ADS_SLOTS.contactDesktopLeft} />
          <ContactContent />
          <AdRail slot={ADS_SLOTS.contactDesktopRight} />
        </div>
      </div>
    </main>
  );
}

