import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

type Props = {
  searchParams: Promise<{ next?: string | string[]; reason?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to MatchMate.live to browse profiles and message your matches.",
  // Canonicalize away redirect-tracking query params (?next=, ?reason=) so they
  // don't get indexed as separate, near-duplicate pages.
  alternates: {
    canonical: "/auth/sign-in",
  },
};

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.next;
  const nextHref = typeof raw === "string" ? raw : undefined;
  const rawReason = params.reason;
  const reason = typeof rawReason === "string" ? rawReason : undefined;
  return <AuthCard mode="signIn" nextHref={nextHref} reason={reason} />;
}
