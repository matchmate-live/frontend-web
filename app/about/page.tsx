import type { Metadata } from "next";
import AboutNavClient from "@/components/about/AboutNavClient";
import AboutContent from "@/components/about/AboutContent";
import AdRail from "@/components/home/AdRail";
import { ADS_SLOTS } from "@/lib/adsConfig";

export const metadata: Metadata = {
  title: "About MatchMate.live",
  description:
    "Learn about MatchMate.live — a modern dating and matrimonial platform built for meaningful connections with privacy-first discovery and messaging.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
      <AboutNavClient />
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <AdRail slot={ADS_SLOTS.aboutDesktopLeft} />
          <AboutContent />
          <AdRail slot={ADS_SLOTS.aboutDesktopRight} />
        </div>
      </div>
    </main>
  );
}

