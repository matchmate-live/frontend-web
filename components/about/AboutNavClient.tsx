"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import { configureAmplifyAuth } from "@/lib/amplify";

export default function AboutNavClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const isConfigured = configureAmplifyAuth();
    if (!isConfigured) {
      setIsLoggedIn(false);
      return;
    }
    getCurrentUser()
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <>
      <HomeNavbar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((value) => !value)} />
      <MobileDrawer
        isLoggedIn={isLoggedIn}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={async () => {
          await signOut();
          setIsLoggedIn(false);
        }}
      />
    </>
  );
}
