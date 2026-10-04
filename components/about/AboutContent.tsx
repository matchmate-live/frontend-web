import AdSlot from "@/components/ads/AdSlot";
import { ADS_SLOTS } from "@/lib/adsConfig";

function MobileAd({ slot }: { slot: string }) {
  return (
    <div className="mt-8 lg:hidden">
      <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
        <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
        <AdSlot className="block min-h-[220px] w-full rounded-md bg-pink-50/50" slot={slot} />
      </div>
    </div>
  );
}

export default function AboutContent() {
  return (
    <article className="rounded-none border-0 bg-white p-3 shadow-none sm:rounded-2xl sm:border sm:border-pink-200 sm:shadow-sm">
      <header>
        <p className="text-sm font-medium text-zinc-600">About</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">About MatchMate.live</h1>
        <p className="mt-3 text-sm text-zinc-700">
          MatchMate.live is a free place to meet people for dating, a serious relationship, or marriage.
          You create a profile, search for people by age and location, and talk to them through private
          messages. That&apos;s it. No subscriptions, no paid &quot;boosts&quot;, and no messages locked
          behind a paywall.
        </p>
        <p className="mt-3 text-sm text-zinc-700">
          We started MatchMate because finding someone online had started to feel like a sales funnel. Most
          apps let you sign up for free and then charge you the moment you want to actually talk to anyone.
          We wanted something simpler: a site where everyone gets the same tools, and the only thing that
          decides who you connect with is whether you get along.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Who it&apos;s for</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Some people come here to date and see where things go. Others are looking for a life partner and
          want to be upfront about that from the first message. Both are welcome, and nobody has to pretend
          to want something they don&apos;t. Your profile is where you say what you&apos;re looking for, so
          the people who reach out to you already know.
        </p>
        <p className="mt-3 text-sm text-zinc-700">
          You need to be 18 or older to use MatchMate.live.
        </p>
      </section>

      <MobileAd slot={ADS_SLOTS.aboutMobileInline0} />

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">How it works</h2>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-zinc-700">
          <li>
            <span className="font-medium text-zinc-900">Set up your profile.</span> Add your name, date of
            birth, where you live and who you&apos;d like to meet. You can add up to five photos, a short bio,
            and optional details like your interests, height, and the age range you&apos;re looking for. Fill
            in as much or as little as you like.
          </li>
          <li>
            <span className="font-medium text-zinc-900">Search.</span> Filter by country, city, age and
            gender. Results show who&apos;s online now and who was around recently, so you&apos;re not writing
            to profiles that went quiet months ago.
          </li>
          <li>
            <span className="font-medium text-zinc-900">Say hello.</span> When someone catches your eye,
            open their profile and send a message. Conversations are private and happen in real time, so you
            can get to know each other before deciding to meet.
          </li>
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Keeping things safe and respectful</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Meeting strangers online takes some trust, so we try to make that easier:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
          <li>
            Members can verify their email address. A verified profile shows a badge next to the name. It
            tells you the person confirmed their email, not that we&apos;ve checked their identity.
          </li>
          <li>
            Photos are checked for explicit content before they&apos;re uploaded, and nudity isn&apos;t
            allowed anywhere on the site.
          </li>
          <li>
            Your email address and phone number are never shown on your profile. Other members only see what
            you choose to put there.
          </li>
          <li>
            Our <a className="font-medium text-pink-600 underline" href="/terms">terms</a>{" "} spell out what&apos;s
            not okay: fake identities, harassment, scams, and asking people for money. If something feels
            wrong, <a className="font-medium text-pink-600 underline" href="/contact">get in touch</a>.
          </li>
        </ul>
      </section>

      <MobileAd slot={ADS_SLOTS.aboutMobileInline1} />

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">A few tips before you meet</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
          <li>Take your time chatting first. Anyone worth meeting will be happy to wait.</li>
          <li>
            Never send money or share passwords, one-time codes or bank details, however good the reason
            sounds.
          </li>
          <li>Meet somewhere public for the first time, and tell a friend where you&apos;re going.</li>
          <li>Trust your gut. If someone pushes to move off the site quickly or avoids simple questions, be careful.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Why it&apos;s free</h2>
        <p className="mt-3 text-sm text-zinc-700">
          MatchMate.live is paid for by the ads you see around the site. That&apos;s the trade: we show
          ads, and in return every feature is free for everyone. We don&apos;t sell your personal details,
          and you&apos;ll never be asked to pay to see who messaged you. Our{" "}
          <a className="font-medium text-pink-600 underline" href="/privacy">privacy policy</a> explains
          exactly what we keep and why.
        </p>
      </section>

      <MobileAd slot={ADS_SLOTS.aboutMobileInline2} />

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Questions people ask</h2>
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border-0 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">Is this a dating site or a matrimonial site?</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Both. Use it however suits you, whether that&apos;s casual dating, something long-term, or
              finding someone to marry.
            </p>
          </div>
          <div className="rounded-xl border-0 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">Do I need an account to look around?</h3>
            <p className="mt-1 text-sm text-zinc-700">
              No. You can search and view profiles without signing up. You&apos;ll need an account to send
              messages or create your own profile.
            </p>
          </div>
          <div className="rounded-xl border-0 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">Which countries can I search?</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Any country, and you can narrow it down to a city if you like. Leave the city empty to see
              people across the whole country.
            </p>
          </div>
          <div className="rounded-xl border-0 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">Can I change my profile later?</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Yes. Your name, bio, photos, interests and the age range you&apos;re looking for can all be
              changed in Settings at any time. Your date of birth, gender and location are fixed once set.
            </p>
          </div>
          <div className="rounded-xl border-0 p-4 sm:border sm:border-pink-200">
            <h3 className="font-semibold text-zinc-900">Is it really free?</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Yes, completely. There&apos;s no premium plan and nothing to unlock.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
