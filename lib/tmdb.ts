// TMDB client. The fetch helpers here run on the SERVER (server components,
// generateMetadata, route handlers) so the API key stays out of the browser
// bundle. The few client-side fetches (search, season/episode lists) go through
// /api/tmdb instead — see app/api/tmdb/[...path]/route.ts.

export const BASE_URL = 'https://api.themoviedb.org/3';
export const IMG_URL = 'https://image.tmdb.org/t/p/w500'; // posters
export const BACKDROP_URL = 'https://image.tmdb.org/t/p/w1280'; // banner
export const STILL_URL = 'https://image.tmdb.org/t/p/w300'; // episode stills

const API_KEY = process.env.TMDB_API_KEY;

export type MediaType = 'movie' | 'tv';

export interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  original_language?: string;
  media_type?: MediaType;
  runtime?: number;
  number_of_seasons?: number;
  seasons?: TmdbSeason[];
}

export interface TmdbSeason {
  season_number: number;
  name?: string;
  episode_count?: number;
}

export interface TmdbEpisode {
  episode_number: number;
  name?: string;
  overview?: string;
  still_path?: string | null;
}

function withKey(path: string, params: Record<string, string | number> = {}) {
  if (!API_KEY) {
    throw new Error(
      'TMDB_API_KEY is not set. Add it to .env.local (dev) or the Cloudflare project env (prod).'
    );
  }
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return url.toString();
}

// Cached server fetch. `revalidate` (seconds) drives Next's ISR — TMDB data is
// re-fetched in the background on this cadence instead of on every request.
async function tmdb<T>(
  path: string,
  params: Record<string, string | number> = {},
  revalidate = 60 * 60 * 24
): Promise<T> {
  const res = await fetch(withKey(path, params), { next: { revalidate } });
  if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

export interface TmdbList {
  results: TmdbItem[];
  total_results?: number;
  total_pages?: number;
}

// ---- Home rows ----
export function getTrending(type: MediaType) {
  return tmdb<TmdbList>(`/trending/${type}/week`).then((d) => d.results || []);
}

export async function getTrendingAnime(): Promise<TmdbItem[]> {
  const pages = await Promise.all(
    [1, 2, 3].map((page) => tmdb<TmdbList>('/trending/tv/week', { page }))
  );
  return pages.flatMap((d) =>
    (d.results || []).filter(
      (item) => item.original_language === 'ja' && (item.genre_ids || []).includes(16)
    )
  );
}

export async function getTrendingKDramas(): Promise<TmdbItem[]> {
  const pages = await Promise.all(
    [1, 2, 3].map((page) =>
      tmdb<TmdbList>('/discover/tv', {
        with_original_language: 'ko',
        sort_by: 'popularity.desc',
        'first_air_date.gte': '2025-06-01',
        page,
      })
    )
  );
  return pages
    .flatMap((d) => (d.results || []).filter((item) => (item.genre_ids || []).includes(18)))
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

// ---- Detail ----
export function getDetails(type: MediaType, id: string | number) {
  return tmdb<TmdbItem>(`/${type}/${id}`, {}, 60 * 60 * 24);
}

// ---- Catalog lists (used to build a broad sitemap) ----
// category: 'popular' | 'top_rated' | 'now_playing' (movie) | 'on_the_air' (tv) | 'trending'
export async function getCatalog(
  type: MediaType,
  category: string,
  pages = 1
): Promise<TmdbItem[]> {
  const pageNums = Array.from({ length: pages }, (_, i) => i + 1);
  const lists = await Promise.all(
    pageNums.map((page) => {
      const path =
        category === 'trending'
          ? `/trending/${type}/week`
          : `/${type}/${category}`;
      return tmdb<TmdbList>(path, { page }, 60 * 60 * 12).catch(
        () => ({ results: [] } as TmdbList)
      );
    })
  );
  return lists.flatMap((d) => d.results || []);
}

// ---- Discover (browse) ----
export function discover(
  type: MediaType,
  params: Record<string, string | number>
) {
  return tmdb<TmdbList>(`/discover/${type}`, params, 60 * 60);
}

// ---- Search ----
// Server-side multi-search (movies + TV + people). Used by the /search results
// page. People and result-less entries are filtered out; we keep only titles
// with a poster so the grid renders cleanly. Cached for an hour like browse.
export async function searchMulti(query: string): Promise<TmdbItem[]> {
  const q = query.trim();
  if (!q) return [];
  const data = await tmdb<TmdbList>('/search/multi', { query: q }, 60 * 60);
  return (data.results || [])
    .filter((i) => i.media_type !== ('person' as MediaType) && i.poster_path)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}
