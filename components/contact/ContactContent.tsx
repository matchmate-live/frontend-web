import AdSlot from "@/components/ads/AdSlot";
import { ADS_SLOTS } from "@/lib/adsConfig";

export default function ContactContent() {
  return (
    <article className="rounded-none border-0 bg-white p-6 shadow-none sm:rounded-2xl sm:border sm:border-pink-200 sm:shadow-sm">
      <header>
        <p className="text-sm font-medium text-zinc-600">Contact</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Contact MatchMate.live</h1>
        <p className="mt-3 text-sm text-zinc-700">
          We are here to help with account questions, feedback, privacy concerns, and safety reports for
          MatchMate.live.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">How to reach us</h2>
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-pink-200 p-4">
            <h3 className="font-semibold text-zinc-900">General support</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Email:{" "}
              <a
                className="cursor-pointer break-all text-pink-300 underline"
                href="mailto:matchmate.live.support@gmail.com"
              >
                matchmate.live.support@gmail.com
              </a>
            </p>
          </div>
          <div className="rounded-xl border border-pink-200 p-4">
            <h3 className="font-semibold text-zinc-900">Safety and abuse reports</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Email:{" "}
              <a
                className="cursor-pointer break-all text-pink-300 underline"
                href="mailto:matchmate.live.safety@gmail.com"
              >
                matchmate.live.safety@gmail.com
              </a>
            </p>
          </div>
          <div className="rounded-xl border border-pink-200 p-4">
            <h3 className="font-semibold text-zinc-900">Business and partnerships</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Email:{" "}
              <a
                className="cursor-pointer break-all text-pink-300 underline"
                href="mailto:matchmate.live.business@gmail.com"
              >
                matchmate.live.business@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 sm:hidden">
        <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
          <AdSlot
            className="block min-h-[220px] w-full rounded-md bg-pink-50/50"
            slot={ADS_SLOTS.contactMobileInline}
          />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Support hours</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Our team typically responds within 24-48 hours on business days.
        </p>
      </section>
    </article>
  );
}

