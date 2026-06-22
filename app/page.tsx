import { preload } from 'react-dom';
import {
  getTrending,
  getTrendingAnime,
  getTrendingKDramas,
  BACKDROP_URL,
  type TmdbItem,
} from '@/lib/tmdb';
import Banner from '@/components/Banner';
import Row from '@/components/Row';

// Rendered at the edge (Cloudflare Pages). Crawlers and the first visitor get
// fully-rendered content (rows + banner) in the initial HTML.
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
      name: 'Where can I watch free movies online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'JustFlixMovies lets you watch free movies online in HD with no sign-up. It is one of the easiest sites for watching free movies and TV shows instantly in your browser.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are some good movies to watch right now?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Check the Trending Movies and Popular TV Shows rows on this page for good movies to watch this week, updated daily.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a website to watch movies for free without registration?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. JustFlixMovies is a free website to watch movies for free — no account, no subscription, just free full movies and shows in HD.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are good family movies to watch together?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Browse our family movies to watch collection for the best movie to watch with family, from animated films to all-ages classics.',
      },
    },
  ],
};

export default async function HomePage() {
  // Fetch all rows server-side in parallel. A failed row degrades to empty
  // instead of breaking the page.
  const [movies, tv, anime, kdramas] = await Promise.all([
    getTrending('movie').catch(() => [] as TmdbItem[]),
    getTrending('tv').catch(() => [] as TmdbItem[]),
    getTrendingAnime().catch(() => [] as TmdbItem[]),
    getTrendingKDramas().catch(() => [] as TmdbItem[]),
  ]);

  const movieRow = movies.map((m) => ({ ...m, media_type: 'movie' as const }));
  const tvRow = tv.map((t) => ({ ...t, media_type: 'tv' as const }));
  const animeRow = anime.map((a) => ({ ...a, media_type: 'tv' as const }));
  const kdramaRow = kdramas.map((k) => ({ ...k, media_type: 'tv' as const }));

  const bannerItems = movieRow.filter((m) => m.backdrop_path).slice(0, 4);

  // Preload the first banner backdrop (the LCP element). Banner renders it as a
  // CSS background, which the browser's preload scanner can't discover early, so
  // we emit a high-priority <link rel="preload"> for the exact same URL.
  const lcpBackdrop = bannerItems[0]?.backdrop_path;
  if (lcpBackdrop) {
    preload(`${BACKDROP_URL}${lcpBackdrop}`, { as: 'image', fetchPriority: 'high' });
  }

  return (
    <>
      <div id="main-content" style={{ display: 'block' }}>
        <Banner items={bannerItems} />
        <Row title="Trending Movies to Watch Online" items={movieRow} />
        <Row title="Popular TV Shows to Stream Online" items={tvRow} />
        <Row title="Watch Free Anime Online" items={animeRow} />
        <Row title="Korean Dramas & K-Series" items={kdramaRow} />
      </div>

      <section className="seo-content" aria-label="About JustFlixMovies">
        <h2>Watch Free Movies Online in HD</h2>
        <p>
          JustFlixMovies is your go-to destination to <strong>watch free movies online</strong> in{' '}
          <strong>HD</strong> quality. If you have been searching for a{' '}
          <strong>website to watch movies for free</strong>, you have found one of the best{' '}
          <strong>sites for watching free movies</strong> — no registration, no subscription, and{' '}
          <strong>free full movies</strong> ready to stream instantly. Our platform brings together a
          massive collection of <strong>trending movies</strong>, popular <strong>TV shows</strong>,{' '}
          <strong>anime series</strong>, and <strong>Korean dramas</strong>, so there is always
          something good to watch.
        </p>

        <h2>Good Movies to Watch — Across Every Genre</h2>
        <p>
          Looking for <strong>good movies to watch</strong> tonight? Whether you want{' '}
          <strong>great movies to watch</strong> with friends or <strong>fun movies to watch</strong>{' '}
          on a lazy weekend, our library is updated daily across every genre. Dive into{' '}
          <strong>horror movies to watch</strong> for a scare, <strong>comedy movies to watch</strong>{' '}
          for a laugh, timeless <strong>classic movies to watch</strong>, or the kind of{' '}
          <strong>movies to watch on Netflix</strong> and other streaming services — available here
          to <strong>watch movies online free</strong>. Use our genre, year, and country filters to
          find exactly what you are in the mood for.
        </p>

        <h2>Family Movies to Watch Together</h2>
        <p>
          Need a <strong>movie to watch with family</strong>? Browse our hand-picked{' '}
          <strong>family movies to watch</strong> — animated adventures, feel-good comedies, and
          all-ages classics everyone will enjoy. With thousands of <strong>HD movies</strong> and
          new titles added every day, JustFlixMovies makes it easy to{' '}
          <strong>watch free movies online</strong> with the people you love.
        </p>

        <h2>What Movie Should I Watch?</h2>
        <p>
          Not sure <strong>what movie should I watch</strong>? Start with our{' '}
          <strong>Trending Movies</strong> row above for the most popular picks this week, or open{' '}
          <a href="/browse">Browse</a> to filter by genre, release year, country, and rating until
          you find the perfect <strong>movies to watch</strong> right now.
        </p>

        <h2>Frequently Asked Questions</h2>
        <dl className="faq">
          <dt>Where can I watch free movies online?</dt>
          <dd>
            JustFlixMovies lets you <strong>watch free movies online</strong> in HD with no sign-up.
            It is one of the easiest <strong>sites for watching free movies</strong> and TV shows
            instantly in your browser.
          </dd>
          <dt>What are some good movies to watch right now?</dt>
          <dd>
            Check the <strong>Trending Movies</strong> and <strong>Popular TV Shows</strong> rows on
            this page for <strong>good movies to watch</strong> this week, updated daily.
          </dd>
          <dt>Is there a website to watch movies for free without registration?</dt>
          <dd>
            Yes. JustFlixMovies is a free <strong>website to watch movies for free</strong> — no
            account, no subscription, just <strong>free full movies</strong> and shows in HD.
          </dd>
          <dt>What are good family movies to watch together?</dt>
          <dd>
            Browse our <strong>family movies to watch</strong> collection for the best{' '}
            <strong>movie to watch with family</strong>, from animated films to all-ages classics.
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
