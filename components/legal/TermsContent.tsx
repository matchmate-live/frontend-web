const EFFECTIVE_DATE = "September 17, 2026";

export default function TermsContent() {
  return (
    <article className="rounded-none border-0 bg-white p-6 shadow-none sm:rounded-2xl sm:border sm:border-pink-200 sm:shadow-sm">
      <header>
        <p className="text-sm font-medium text-zinc-600">Terms of Service</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Terms of Service</h1>
        <p className="mt-3 text-sm text-zinc-700">Last updated {EFFECTIVE_DATE}.</p>
        <p className="mt-3 text-sm text-zinc-700">
          The short version: be honest, be respectful, and don&apos;t use MatchMate.live to hurt or
          deceive anyone. The rest of this page spells out what that means and what to expect from us.
          Creating an account means you&apos;re agreeing to it.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Who can use this</h2>
        <p className="mt-3 text-sm text-zinc-700">
          You need to be 18 or older. Signing up is you telling us that&apos;s true, that what&apos;s on
          your profile is accurate, and that you&apos;re not someone we&apos;ve already banned from the
          service.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Your account</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Whatever happens under your login is on you, so keep your credentials to yourself. If something
          feels off — you didn&apos;t send that message, you can&apos;t get in — tell us right away.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">What&apos;s not okay</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Most of this is common sense, but to spell it out — on MatchMate.live, please don&apos;t:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
          <li>Pretend to be someone you&apos;re not, or build a profile around a fake identity.</li>
          <li>Harass, threaten, or otherwise make another member feel unsafe.</li>
          <li>Post anything illegal, hateful, or sexually explicit — especially involving minors or anyone who hasn&apos;t consented.</li>
          <li>Use the platform to sell something, run a scam, or ask people for money.</li>
          <li>Scrape the site or automate anything that isn&apos;t just... using it like a person would.</li>
          <li>Try to get into someone else&apos;s account, or mess with how the service runs for everyone else.</li>
        </ul>
        <p className="mt-3 text-sm text-zinc-700">
          Breaking these isn&apos;t always an instant ban, but it can be — we&apos;ll use judgment based on
          what happened.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">What you post</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Your photos and your words stay yours — we&apos;re not claiming ownership of anything you upload.
          What we do need is permission to actually show it to other members, since that&apos;s the whole
          function of a profile. In exchange, you&apos;re telling us you actually have the right to post
          whatever you&apos;re posting.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">A word on safety</h2>
        <p className="mt-3 text-sm text-zinc-700">
          We don&apos;t run background checks on members, and honestly, no dating platform fully can. So
          use the same judgment you would anywhere online — take your time before sharing anything
          personal or financial, and if you meet someone in person, make it a public place, at least the
          first time. Whatever happens between members, on the app or off it, isn&apos;t something we can
          take responsibility for.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">How this stays free</h2>
        <p className="mt-3 text-sm text-zinc-700">
          MatchMate.live doesn&apos;t charge anyone to use it — ads, through Google AdSense, cover the
          cost instead. That means you&apos;ll see ads scattered around search results, profiles, and a
          few other pages.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Ending an account</h2>
        <p className="mt-3 text-sm text-zinc-700">
          We can suspend or close an account that breaks these terms or puts other people at risk. Going
          the other direction — if you want to leave — just email{" "}
          <a className="text-pink-300 underline" href="mailto:matchmate.live.support@gmail.com">
            matchmate.live.support@gmail.com
          </a>{" "}
          and we&apos;ll take it from there.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">The fine print</h2>
        <p className="mt-3 text-sm text-zinc-700">
          MatchMate.live is offered as-is — we can&apos;t promise you&apos;ll find a match, or that
          nothing will ever go wrong technically. To whatever extent the law allows, we&apos;re not liable
          for damages coming out of your use of the service or your dealings with other members.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">If these terms change</h2>
        <p className="mt-3 text-sm text-zinc-700">
          We may update this page occasionally. If you keep using MatchMate.live after a change goes up,
          that counts as accepting it.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Questions?</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Email{" "}
          <a className="text-pink-300 underline" href="mailto:matchmate.live.support@gmail.com">
            matchmate.live.support@gmail.com
          </a>{" "}
          and we&apos;ll help however we can.
        </p>
      </section>
    </article>
  );
}
