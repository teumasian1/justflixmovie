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
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I search for a movie to watch?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Type any movie, TV show, anime, or Korean drama into the search bar and press Search. JustFlixMovies instantly finds matching titles you can watch free online in HD — no account needed.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where can I watch free movies online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'JustFlixMovies lets you watch free movies online in HD with no sign-up. Search for a title above, or browse the curated trending list for good movies to watch this week.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is JustFlixMovies free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Searching and watching are completely free — no registration, no subscription, just free full movies and shows streaming in HD.',
      },
    },
    {
      '@type': 'Question',
      name: 'What can I search for on JustFlixMovies?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Search across movies, popular TV series, trending anime, and Korean dramas. Our library is updated daily, so new releases are searchable as soon as they trend.',
      },
    },
  ],
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
          <Link href="/home" className="hero-landing-cta">
            Or browse the curated trending list <i className="fas fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="seo-content" aria-label="About searching on JustFlixMovies">
        <h2>Search Thousands of Free Movies &amp; TV Shows</h2>
        <p>
          JustFlixMovies makes it effortless to <strong>search for movies to watch</strong> and
          stream them online in <strong>HD</strong> — completely free. Whether you already know the
          title or you are still deciding <strong>what movie to watch</strong>, just type into the
          search bar above and get instant results across <strong>movies</strong>,{' '}
          <strong>TV shows</strong>, <strong>anime</strong>, and <strong>Korean dramas</strong>. No
          account, no subscription, no waiting.
        </p>

        <h2>Watch Free Movies Online — No Registration</h2>
        <p>
          Looking for a <strong>website to watch movies for free</strong>? You found one of the best{' '}
          <strong>sites for watching free movies</strong>. Every result links straight to a free,{' '}
          <strong>HD</strong> stream you can play in your browser. Our catalog is updated daily, so{' '}
          <strong>trending movies</strong> and new releases become searchable the moment they drop.
        </p>

        <h2>Not Sure What to Watch? Browse the Curated List</h2>
        <p>
          Cannot decide <strong>what movie should I watch</strong>? Skip the search and open our{' '}
          <Link href="/home">curated trending list</Link> for the most popular{' '}
          <strong>movies to watch</strong> this week, popular <strong>TV shows</strong>,{' '}
          <strong>anime</strong>, and <strong>Korean dramas</strong> — or head to{' '}
          <a href="/browse">Browse</a> to filter by genre, year, country, and rating.
        </p>

        <h2>Frequently Asked Questions</h2>
        <dl className="faq">
          <dt>How do I search for a movie to watch?</dt>
          <dd>
            Type any movie, TV show, anime, or Korean drama into the <strong>search bar</strong>{' '}
            above and press Search. JustFlixMovies instantly finds matching titles you can{' '}
            <strong>watch free online</strong> in HD — no account needed.
          </dd>
          <dt>Where can I watch free movies online?</dt>
          <dd>
            JustFlixMovies lets you <strong>watch free movies online</strong> in HD with no sign-up.
            Search for a title above, or browse the{' '}
            <Link href="/home">curated trending list</Link> for good movies to watch this week.
          </dd>
          <dt>Is JustFlixMovies free to use?</dt>
          <dd>
            Yes. Searching and watching are completely free — no registration, no subscription, just{' '}
            <strong>free full movies</strong> and shows streaming in HD.
          </dd>
          <dt>What can I search for on JustFlixMovies?</dt>
          <dd>
            Search across <strong>movies</strong>, popular <strong>TV series</strong>, trending{' '}
            <strong>anime</strong>, and <strong>Korean dramas</strong>. Our library is updated daily.
          </dd>
        </dl>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
