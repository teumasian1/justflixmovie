import type { MetadataRoute } from 'next';
import { getCatalog, type TmdbItem } from '@/lib/tmdb';
import { buildHref } from '@/lib/slug';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://justflixmovies.online';

// Dynamic sitemap. Instead of the old hand-maintained sitemap2.xml (101 fixed
// URLs), this pulls a broad slice of the TMDB catalog — popular, top-rated,
// now-playing/on-air, and trending — across several pages for both movies and
// TV, dedupes, and regenerates daily. New titles get discovered automatically.
//
// TMDB returns 20 results per page, so PAGES_PER_LIST=5 ≈ 100 titles per list.
// With 4 movie lists + 4 tv lists that's a ceiling of ~800 titles before dedupe.
export const runtime = 'edge';
export const revalidate = 86400;

const PAGES_PER_LIST = 5;

const MOVIE_LISTS = ['popular', 'top_rated', 'now_playing', 'trending'];
const TV_LISTS = ['popular', 'top_rated', 'on_the_air', 'trending'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [movieLists, tvLists] = await Promise.all([
    Promise.all(MOVIE_LISTS.map((c) => getCatalog('movie', c, PAGES_PER_LIST))),
    Promise.all(TV_LISTS.map((c) => getCatalog('tv', c, PAGES_PER_LIST))),
  ]);

  const movies = movieLists.flat();
  const tv = tvLists.flat();

  const now = new Date();
  const seen = new Set<string>();

  // Normalize a raw TMDB date string into a valid Date. TMDB data is messy: some
  // entries are empty, some are unparseable, and some have typo years like
  // "0201-12-25" or "0001-01-01" that parse to a *valid* Date object but serialize
  // to a nonsensical <lastmod> year Google rejects. So we reject NaN AND any date
  // outside a sane range (first film ever → tomorrow), falling back to `now`.
  const MIN_YEAR = 1888; // Roundhay Garden Scene, the oldest surviving film
  const maxTime = now.getTime() + 24 * 60 * 60 * 1000; // allow up to tomorrow
  const toLastModified = (raw?: string): Date => {
    if (!raw) return now;
    const d = new Date(raw);
    const t = d.getTime();
    if (isNaN(t) || d.getUTCFullYear() < MIN_YEAR || t > maxTime) return now;
    return d;
  };

  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/browse`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const add = (type: 'movie' | 'tv', items: TmdbItem[]) => {
    for (const item of items) {
      if (!item.id) continue;
      const href = buildHref(type, item);
      if (seen.has(href)) continue;
      seen.add(href);
      entries.push({
        url: `${SITE_URL}${href}`,
        // Use the release/air date as lastModified when available, else now.
        lastModified: toLastModified(item.release_date || item.first_air_date),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  };

  add('movie', movies);
  add('tv', tv);

  return entries;
}
