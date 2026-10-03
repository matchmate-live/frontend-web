import type { Metadata } from "next";
import { Suspense } from "react";
import HomeClient from "@/components/home/HomeClient";

export const metadata: Metadata = {
  // `absolute` skips the title template, so the homepage title is just the site name.
  title: { absolute: "MatchMate.live — Find Your Match" },
  description:
    "Browse verified profiles near you and start meaningful conversations on MatchMate.live — a free dating and matrimonial platform built for serious, long-term connections.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MatchMate.live — Find Your Match",
    description:
      "Browse verified profiles near you and start meaningful conversations on MatchMate.live.",
    url: "/",
  },
  twitter: {
    title: "MatchMate.live — Find Your Match",
    description:
      "Browse verified profiles near you and start meaningful conversations on MatchMate.live.",
  },
};

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  );
}
