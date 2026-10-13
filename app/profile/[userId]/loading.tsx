"use client";

import HomeNavbar from "@/components/home/HomeNavbar";
import ProfileDetailSkeleton from "@/components/profile/ProfileDetailSkeleton";

// Shown right after a profile link is clicked. Profile links don't prefetch, so this gives
// instant feedback while the route loads. Same column layout as the page, without ads.
export default function ProfileLoading() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-pink-50/10 text-zinc-900">
      <HomeNavbar menuOpen={false} onToggleMenu={() => {}} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-0 lg:px-6 lg:py-6">
        <div className="grid flex-1 items-stretch gap-0 lg:grid-cols-[280px_minmax(0,1fr)_280px] lg:gap-6">
          <div className="hidden lg:block" />
          <div className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col bg-white lg:min-h-[calc(100vh-7rem)]">
            <div className="border-b border-pink-100 px-4 py-3 sm:px-6">
              <div className="h-8" />
            </div>
            <ProfileDetailSkeleton />
          </div>
          <div className="hidden lg:block" />
        </div>
      </div>
    </main>
  );
}
