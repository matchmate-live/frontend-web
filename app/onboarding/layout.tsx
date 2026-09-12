import { Suspense } from "react";
import CompleteProfileBanner from "@/components/onboarding/CompleteProfileBanner";
import OnboardingChrome from "@/components/onboarding/OnboardingChrome";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingChrome>
      <div className="mx-auto w-full max-w-lg px-4 py-8 pb-24">
        <Suspense fallback={null}>
          <CompleteProfileBanner />
        </Suspense>
        {children}
      </div>
    </OnboardingChrome>
  );
}
