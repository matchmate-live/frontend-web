"use client";

import { useEffect, useState } from "react";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import { configureAmplifyAuth } from "@/lib/amplify";
import { getCurrentUser, signOut } from "aws-amplify/auth";

export default function OnboardingChrome({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!configureAmplifyAuth()) return;
    getCurrentUser()
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <div className="min-h-screen bg-pink-50/10 text-zinc-900">
      <HomeNavbar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)} />
      <MobileDrawer
        isLoggedIn={isLoggedIn}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={async () => {
          await signOut();
          setIsLoggedIn(false);
        }}
      />
      {children}
    </div>
  );
}
