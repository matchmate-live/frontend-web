import type { Metadata } from "next";
import ForgotPasswordCard from "@/components/auth/ForgotPasswordCard";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your MatchMate.live password.",
  alternates: {
    canonical: "/auth/forgot-password",
  },
  // Utility page with nothing worth showing in search results. Not blocked in robots.txt,
  // since crawlers have to load the page to see this noindex.
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordCard />;
}
