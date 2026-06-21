import {
  getTrending,
  getTrendingAnime,
  getTrendingKDramas,
  type TmdbItem,
} from '@/lib/tmdb';
import Banner from '@/components/Banner';
import Row from '@/components/Row';

// Rendered at the edge (Cloudflare Pages). Crawlers and the first visitor get
// fully-rendered content (rows + banner) in the initial HTML.
export const runtime = 'edge';
export const revalidate = 3600;

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
        <p>
          JustFlixMovies is your go-to destination to <strong>watch free movies online in HD</strong>{' '}
          quality. Our platform brings together a massive collection of{' '}
          <strong>trending movies</strong>, popular <strong>TV shows</strong>,{' '}
          <strong>anime series</strong>, and <strong>Korean dramas</strong> — all available to
          stream instantly with no registration or subscription required.
        </p>
        <p>
          Our library is updated daily with new releases across every genre imaginable: action,
          adventure, comedy, drama, horror, sci-fi, romance, thriller, and more. Use our advanced
          filters to <strong>browse by genre, release year, country, and popularity rating</strong>{' '}
          to find exactly what you want to watch.
        </p>
        <p>
          Anime fans can explore our curated collection of <strong>free anime streaming</strong>{' '}
          titles, and K-drama enthusiasts will find the latest{' '}
          <strong>Korean dramas with English subtitles</strong>, updated regularly. Start streaming
          now and discover your next favorite show.
        </p>
      </section>
    </>
  );
}
