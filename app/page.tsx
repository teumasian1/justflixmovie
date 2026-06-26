import Link from 'next/link';
import HeroSearch from '@/components/HeroSearch';

// Welcome / landing page (site entry point at "/"). Search-first: visitors can
// look up any title immediately, or follow the call-to-action into the curated
// list at /home. Rendered at the edge so crawlers get the full hero + SEO copy
// in the initial HTML. The homepage <title>/description come from layout.tsx's
// metadata defaults; canonical "/" is set there too.
export const runtime = 'edge';
export const revalidate = 3600;

// FAQPage schema — mirrors the visible FAQ below so the Q&A can show as a rich
// result. Google requires the structured data to match the on-page text.
const FAQ = [
  {
    q: 'Is JustFlixMovies free to use?',
    a: 'Yes, JustFlixMovies is completely free. There is no registration, no subscription, and no payment of any kind. Pick a title and start streaming in HD right away.',
  },
  {
    q: 'Do I need an account to watch movies and TV shows?',
    a: 'No account or sign-up is required. You can watch free movies and TV shows online instantly in your browser, with nothing to download or install.',
  },
  {
    q: 'Can I watch movies in HD without downloading them?',
    a: 'Yes. Every title streams in HD directly in your browser, and each one offers multiple backup servers so you can switch instantly if a stream is slow or unavailable.',
  },
  {
    q: 'What can I watch on JustFlixMovies?',
    a: 'Movies, popular TV series, trending anime, and Korean dramas, all in one place. The catalog is updated daily, so new releases appear as soon as they are available to stream.',
  },
  {
    q: 'How do I find something to watch?',
    a: 'Type any title into the search bar for instant results, or open the curated trending list and use the Browse filters to sort by genre, release year, country, and rating.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function WelcomePage() {
  return (
    <>
      <section className="hero-landing" aria-label="Search free movies and TV shows">
        <div className="hero-landing-inner">
          <span className="banner-kicker">Free · HD · No sign-up</span>
          <h1>Search &amp; Watch Free Movies Online in HD</h1>
          <p>
            Find any movie, TV show, anime, or Korean drama and stream it instantly — no
            registration, no subscription. Start typing to search thousands of free titles.
          </p>
          <HeroSearch />
          {/* Plain <a> (not next/link) so the first tap always triggers a native
              browser navigation, even before React hydrates. With <Link>, a tap
              during the mobile hydration window can be swallowed (looks like a
              no-op until the second tap). A real <a href> has no such race. */}
          <a href="/home" className="hero-landing-cta">
            Or browse the curated trending list <i className="fas fa-arrow-right" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="seo-content" aria-label="About JustFlixMovies">
        <h2>Watch Free Movies &amp; TV Shows Online in HD</h2>
        <p>
          JustFlixMovies is a free streaming site where you can <strong>watch movies and TV shows
          online in HD</strong> — no account, no subscription, no sign-up. Search for any title or
          explore a catalog of <strong>trending movies</strong>, popular series,{' '}
          <strong>anime</strong>, and <strong>Korean dramas</strong> that is refreshed daily, then
          press play and stream instantly in your browser. Every title links to a free HD stream
          backed by several mirror servers, so there is always a way to watch.
        </p>

        <h2>How to Find Something to Watch</h2>
        <p>
          Already know the title? Type it into the search bar above for instant results across
          movies, TV shows, anime, and K-dramas. Still deciding <strong>what to watch tonight</strong>?
          Open the <Link href="/home">curated trending list</Link> for this week&apos;s most popular
          picks, or use <Link href="/browse">Browse</Link> to filter by genre, release year, country,
          and rating — an easy way to narrow things down by mood, from horror and thrillers to comedy,
          romance, and family films.
        </p>

        <h2>Why Stream with JustFlixMovies</h2>
        <ul className="seo-list">
          <li><strong>100% free</strong> — no registration, subscription, or hidden fees.</li>
          <li><strong>HD streaming</strong> with multiple backup servers if one is slow.</li>
          <li><strong>Updated daily</strong> with new and trending releases.</li>
          <li>Movies, TV series, anime, and Korean dramas in one place.</li>
          <li>Works in any modern browser, on desktop or mobile — nothing to install.</li>
        </ul>

        <h2>Frequently Asked Questions</h2>
        <dl className="faq">
          {FAQ.map(({ q, a }) => (
            <div key={q}>
              <dt>{q}</dt>
              <dd>{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
