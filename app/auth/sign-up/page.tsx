import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your free MatchMate.live account and start discovering meaningful, long-term connections near you.",
  alternates: {
    canonical: "/auth/sign-up",
  },
};

export default function SignUpPage() {
  return <AuthCard mode="signUp" />;
}
