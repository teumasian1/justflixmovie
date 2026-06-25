import type { Metadata } from 'next';
import { preload } from 'react-dom';
import {
  getTrending,
  getTrendingAnime,
  getTrendingKDramas,
  BACKDROP_URL,
  type TmdbItem,
} from '@/lib/tmdb';
import { buildItemListJsonLd } from '@/lib/detail';
import Banner from '@/components/Banner';
import Row from '@/components/Row';
import WatchHistoryRow from '@/components/WatchHistoryRow';

// Curated list page: the banner slideshow + trending rows. Reachable from the
// welcome landing (/) via the "Browse the curated list" call-to-action.
// Rendered at the edge so crawlers and the first visitor get fully-rendered
// content (rows + banner) in the initial HTML, plus an ItemList covering the
// top titles so Google can render a carousel rich result.
export const runtime = 'edge';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Trending Movies & TV Shows to Watch Now',
  description:
    'Browse this week’s trending movies, popular TV shows, anime, and Korean dramas — a curated list you can watch free online in HD, no registration required.',
  alternates: { canonical: '/home' },
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

  // ItemList over the trending movies — the headline row. Capped at 30 entries
  // by buildItemListJsonLd. This covers the top titles for the carousel rich
  // result; the visible rows below carry the rest as crawlable <a> links.
  const itemList = buildItemListJsonLd(movieRow, 'Trending Movies & TV Shows');

  return (
    <>
      <div style={{ display: 'block' }}>
        <Banner items={bannerItems} />
        <WatchHistoryRow />
        <Row title="Trending Movies to Watch Online" items={movieRow} />
        <Row title="Popular TV Shows to Stream Online" items={tvRow} />
        <Row title="Watch Free Anime Online" items={animeRow} />
        <Row title="Korean Dramas & K-Series" items={kdramaRow} />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </>
  );
}
