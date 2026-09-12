import { Suspense } from "react";
import OnboardingPhotosForm from "./OnboardingPhotosForm";

export default function OnboardingPhotosPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Loading…</p>
        </div>
      }
    >
      <OnboardingPhotosForm />
    </Suspense>
  );
}
