import type { Metadata } from "next";
import AboutNavClient from "@/components/about/AboutNavClient";
import TermsContent from "@/components/legal/TermsContent";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of MatchMate.live.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
      <AboutNavClient />
      <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
        <TermsContent />
      </div>
    </main>
  );
}
