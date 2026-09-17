import type { Metadata } from "next";
import SettingsView from "@/components/settings/SettingsView";

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Manage your MatchMate.live profile, photos, and account details.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return <SettingsView />;
}
