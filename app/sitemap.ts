import type { MetadataRoute } from 'next';
import { getCatalog, type TmdbItem } from '@/lib/tmdb';
import { buildHref } from '@/lib/slug';
import { GENRES } from '@/lib/browse';

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

  // Normalize a raw TMDB date string into a Date that Google's sitemap validator
  // accepts. TMDB data is messy and old films break <lastmod> in two ways:
  //   1. empty / unparseable / typo-year strings ("", "0201-12-25").
  //   2. pre-1970 release dates ("1957-04-10") — these are valid ISO strings, but
  //      Google rejects lastmod values before the Unix epoch (negative timestamps).
  // Both fall back to `now`, which is also semantically correct: lastmod is when
  // OUR page last changed, and these pages are (re)generated now, not in 1957.
  const MIN_TIME = Date.parse('1970-01-01T00:00:00Z'); // Unix epoch; Google's floor
  const maxTime = now.getTime() + 24 * 60 * 60 * 1000; // allow up to tomorrow
  const toLastModified = (raw?: string): Date => {
    if (!raw) return now;
    const t = new Date(raw).getTime();
    if (isNaN(t) || t < MIN_TIME || t > maxTime) return now;
    return new Date(t);
  };

  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/home`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/browse`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  // High-value category landing pages — Movies/TV roots plus the main genre ×
  // type combos. These are the keyword-targetable URLs ("action movies",
  // "horror tv shows", etc.) that the per-filter canonical (see browse/page.tsx)
  // now makes indexable. Only the top genres are listed (the ones users
  // actually search for); niche genres would dilute crawl budget.
  const CATEGORY_TYPES: ('movie' | 'tv')[] = ['movie', 'tv'];
  // Skip the empty "All Genres" entry; keep only the high-traffic genres.
  const TOP_GENRES = GENRES.filter(([id]) => id !== '');
  for (const type of CATEGORY_TYPES) {
    // Root category page: /browse?type=movie, /browse?type=tv
    entries.push({
      url: `${SITE_URL}/browse?type=${type}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
    // Genre × type pages: /browse?type=movie&genre=28, etc.
    for (const [genreId] of TOP_GENRES) {
      entries.push({
        url: `${SITE_URL}/browse?type=${type}&genre=${genreId}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

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
