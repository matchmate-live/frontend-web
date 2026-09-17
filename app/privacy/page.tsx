import type { Metadata } from "next";
import AboutNavClient from "@/components/about/AboutNavClient";
import PrivacyContent from "@/components/legal/PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MatchMate.live collects, uses, and protects your information, and the choices you have about it.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
      <AboutNavClient />
      <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
        <PrivacyContent />
      </div>
    </main>
  );
}
