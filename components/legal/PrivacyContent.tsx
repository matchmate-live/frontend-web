const EFFECTIVE_DATE = "September 17, 2026";

export default function PrivacyContent() {
  return (
    <article className="rounded-none border-0 bg-white p-6 shadow-none sm:rounded-2xl sm:border sm:border-pink-200 sm:shadow-sm">
      <header>
        <p className="text-sm font-medium text-zinc-600">Privacy Policy</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Privacy Policy</h1>
        <p className="mt-3 text-sm text-zinc-700">Last updated {EFFECTIVE_DATE}.</p>
        <p className="mt-3 text-sm text-zinc-700">
          We wrote this in plain language on purpose — a privacy policy nobody actually reads isn&apos;t
          worth much. Here&apos;s what we collect on MatchMate.live, why, and what say you have over it.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">What we collect</h2>
        <div className="mt-3 space-y-3 text-sm text-zinc-700">
          <p>
            Signing up needs an email address, and a phone number too if you&apos;re not using Google to
            sign in. Building out a profile means telling us your name, birthday, gender, and who
            you&apos;re hoping to meet, plus roughly where you live. A bio and a few photos are optional,
            though most people add at least one.
          </p>
          <p>
            Once you start messaging someone, we keep those conversations so they&apos;re there the next
            time you open the app — that&apos;s really the whole point of storing them. If you let your
            browser share your location, we use it once to suggest a sensible starting point for your
            search filters; we don&apos;t keep the exact coordinates anywhere, just whichever country and
            city you end up searching by. And if you sign in with Google, they pass us your email address
            so we can set up the account on our end.
          </p>
          <p>
            Beyond that, there&apos;s the ordinary technical stuff any website picks up automatically —
            things like your IP address, handled by our hosting provider rather than anything we build
            ourselves.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">What we use it for</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Mostly for exactly what you&apos;d expect: showing your profile to people searching nearby,
          delivering your messages, and confirming your email actually belongs to you. When something goes
          wrong or someone reports abuse, we use account and message data to look into it. And since
          MatchMate.live doesn&apos;t charge for accounts, ads through Google AdSense are how the lights
          stay on — which is its own line item below.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Who sees it</h2>
        <p className="mt-3 text-sm text-zinc-700">
          We don&apos;t sell your data — advertising is the business model here, not data brokering. What
          we do share, and with whom, comes down to three groups. Amazon Web Services hosts basically
          everything (accounts, the database, photo storage, outgoing email), strictly as infrastructure —
          they process it on our instructions, not their own. Google sees a bit too, through AdSense for
          ads and, if you use it, Google Sign-In — their own privacy policy covers what happens to data on
          their side of that. And other members see whatever your profile and messages are built to show
          them, which is the whole idea of the app. Beyond that, the only other case is law enforcement,
          and only when we&apos;re legally required to comply.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Cookies and local storage</h2>
        <p className="mt-3 text-sm text-zinc-700">
          On our side, browser storage is purely functional — staying signed in, remembering your last
          search filters, that kind of thing. Google AdSense sets its own cookies separately to show and
          measure ads, independent of anything we control. If you&apos;d rather tune how that works, Google
          exposes controls for it directly at{" "}
          <a
            className="text-pink-300 underline"
            href="https://adssettings.google.com"
            rel="noreferrer noopener"
            target="_blank"
          >
            adssettings.google.com
          </a>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">How long we keep it</h2>
        <p className="mt-3 text-sm text-zinc-700">
          As long as your account exists, basically. If you&apos;d rather it didn&apos;t, email{" "}
          <a className="text-pink-300 underline" href="mailto:matchmate.live.support@gmail.com">
            matchmate.live.support@gmail.com
          </a>{" "}
          and ask us to delete it — we&apos;ll take care of it within a reasonable window, aside from
          anything we&apos;re legally obligated to hold onto a bit longer.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Keeping it secure</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Everything moves over HTTPS and sits encrypted at rest, with access locked down on our
          infrastructure. That said, no system is perfectly unbreakable, so we can&apos;t promise absolute
          security — just that we take reasonable, standard precautions seriously.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Who this is for</h2>
        <p className="mt-3 text-sm text-zinc-700">
          MatchMate.live is built for adults — you need to be 18 or older to use it, and we don&apos;t
          knowingly collect information from anyone younger.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Your say in all this</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Most of your profile is editable right from your account, any time. For anything else — seeing
          what we have on file, correcting it, deleting it, or just asking a question — reach out and
          we&apos;ll sort it out.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">If this changes</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Should we make a meaningful change to this policy, we&apos;ll update the date at the top and, if
          it&apos;s significant enough, make sure you hear about it another way too.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Questions?</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Email{" "}
          <a className="text-pink-300 underline" href="mailto:matchmate.live.support@gmail.com">
            matchmate.live.support@gmail.com
          </a>{" "}
          — a real person reads that inbox.
        </p>
      </section>
    </article>
  );
}
