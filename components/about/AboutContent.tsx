import AdSlot from "@/components/ads/AdSlot";
import { ADS_SLOTS } from "@/lib/adsConfig";

export default function AboutContent() {
  return (
    <article className="rounded-none border-0 bg-white p-3 shadow-none sm:rounded-2xl sm:border sm:border-pink-200 sm:shadow-sm">
      <header>
        <p className="text-sm font-medium text-zinc-600">About</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">MatchMate.live</h1>
        <p className="mt-3 text-sm text-zinc-700">
          MatchMate.live is a free modern dating and matrimonial platform built to help people discover meaningful
          connections—whether you&apos;re looking for companionship, a serious relationship, or marriage. The platform is
          completely free for users and supported through ads.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">What we do</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-700">
          <li>
            <span className="font-medium text-zinc-900">Discover profiles:</span> Browse relevant profiles using
            filters like age, country, city, and gender.
          </li>
          <li>
            <span className="font-medium text-zinc-900">Start conversations:</span> Message people you connect
            with and build trust over time.
          </li>
          <li>
            <span className="font-medium text-zinc-900">Safe, respectful experience:</span> We encourage real
            profiles, transparent intentions, and respectful communication.
          </li>
        </ul>
      </section>

      <div className="mt-8 lg:hidden">
        <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
          <AdSlot
            className="block min-h-[220px] w-full rounded-md bg-pink-50/50"
            slot={ADS_SLOTS.aboutMobileInline0}
          />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Our approach</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border-0 bg-pink-50/30 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">Quality over quantity</h3>
            <p className="mt-1 text-sm text-zinc-700">
              We focus on relevant discovery and clear filters so you can spend time on the right matches.
            </p>
          </div>
          <div className="rounded-xl border-0 bg-pink-50/30 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">Privacy-first</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Your personal details (like email and phone) are used for account records and are not shared
              publicly.
            </p>
          </div>
          <div className="rounded-xl border-0 bg-pink-50/30 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">Real conversations</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Built-in messaging makes it easy to get to know someone before taking the next step.
            </p>
          </div>
          <div className="rounded-xl border-0 bg-pink-50/30 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">Inclusive & respectful</h3>
            <p className="mt-1 text-sm text-zinc-700">
              We aim to build a community that values respect, consent, and honest intentions.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 lg:hidden">
        <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
          <AdSlot
            className="block min-h-[220px] w-full rounded-md bg-pink-50/50"
            slot={ADS_SLOTS.aboutMobileInline1}
          />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Safety tips</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
          <li>Chat in-app first and take your time getting comfortable.</li>
          <li>Never share sensitive details (OTP codes, passwords, bank info).</li>
          <li>For first meetings, choose a public place and let a friend know.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Pricing & support model</h2>
        <p className="mt-3 text-sm text-zinc-700">
          MatchMate.live is completely free to use. We do not charge users for profile discovery or conversations.
          The platform is sustained through advertising only.
        </p>
      </section>

      <div className="mt-8 lg:hidden">
        <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
          <AdSlot
            className="block min-h-[220px] w-full rounded-md bg-pink-50/50"
            slot={ADS_SLOTS.aboutMobileInline2}
          />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">FAQ</h2>
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border-0 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">Is MatchMate.live a dating app or a matrimonial site?</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Both. You can use MatchMate.live for dating, serious relationships, or matrimonial matchmaking.
              Filters and discovery support different goals.
            </p>
          </div>
          <div className="rounded-xl border-0 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">Can I browse without an account?</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Yes, profile discovery may be available publicly. Messaging and conversations require signing in.
            </p>
          </div>
          <div className="rounded-xl border-0 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">What locations are supported?</h3>
            <p className="mt-1 text-sm text-zinc-700">
              You can search by country and optionally by city. City selection includes a broad list of cities per
              selected country.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
