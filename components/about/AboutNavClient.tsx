"use client";

import { useState } from "react";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function AboutNavClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, signOut } = useAuth();

  return (
    <>
      <HomeNavbar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((value) => !value)} />
      <MobileDrawer
        isLoggedIn={isLoggedIn}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={signOut}
      />
    </>
  );
}
