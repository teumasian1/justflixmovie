import type { MediaType } from './tmdb';

// Shared browse logic between the server page (app/browse/page.tsx) and the
// client <Browse> component (components/Browse.tsx). Keeping the filter→params
// mapping in one place guarantees the SSR HTML (what crawlers see) matches what
// the client hydrates against, so the ItemList and visible grid never disagree.

export const GENRES = [
  ['', 'All Genres'], ['28', 'Action'], ['12', 'Adventure'], ['16', 'Animation'],
  ['35', 'Comedy'], ['80', 'Crime'], ['99', 'Documentary'], ['18', 'Drama'],
  ['10751', 'Family'], ['14', 'Fantasy'], ['36', 'History'], ['27', 'Horror'],
  ['10402', 'Music'], ['9648', 'Mystery'], ['10749', 'Romance'],
  ['878', 'Science Fiction'], ['53', 'Thriller'],
] as const;

export const COUNTRIES = [
  ['', 'All Countries'], ['US', 'United States'], ['GB', 'United Kingdom'],
  ['FR', 'France'], ['DE', 'Germany'], ['IT', 'Italy'], ['ES', 'Spain'],
  ['JP', 'Japan'], ['KR', 'South Korea'], ['IN', 'India'], ['CN', 'China'],
] as const;

export const SORTS = [
  ['popularity.desc', 'Popularity'],
  ['vote_average.desc', 'Rating'],
  ['release_date.desc', 'Release Date'],
] as const;

export const ITEMS_PER_PAGE = 36;

// The canonical filter state derived from a set of URL search params. `type`
// defaults to 'movie' (matching the client), and every other filter defaults to
// empty / the most-popular sort so a bare /browse URL is deterministic.
export interface BrowseFilters {
  type: MediaType;
  genre: string;
  year: string;
  country: string;
  sort: string;
  page: number;
}

export function filtersFromParams(params: URLSearchParams): BrowseFilters {
  return {
    type: params.get('type') === 'tv' ? 'tv' : 'movie',
    genre: params.get('genre') || '',
    year: params.get('year') || '',
    country: params.get('country') || '',
    sort: params.get('sort') || 'popularity.desc',
    page: Math.max(1, Number(params.get('page')) || 1),
  };
}

// Turn the filter state into TMDB discover query params. Mirrors the inline
// logic that was in components/Browse.tsx (kept here so SSR + client agree).
export function discoverParams(f: BrowseFilters): Record<string, string> {
  const params: Record<string, string> = { page: String(f.page), sort_by: f.sort };
  if (f.genre) params.with_genres = f.genre;
  // Year must use the right per-type param: movies filter by primary release
  // year, TV by first-air year.
  if (f.year) {
    params[f.type === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = f.year;
  }
  if (f.country) params.with_origin_country = f.country;
  // Hide titles with no stream yet (mirrors the client). Movies need a passed
  // release date AND a home-viewing release type (4|5|6); TV just needs to have
  // aired.
  const today = new Date().toISOString().slice(0, 10);
  if (f.type === 'movie') {
    params.release_date_lte = today;
    params.with_release_type = '4|5|6';
  } else {
    params.first_air_date_lte = today;
  }
  return params;
}

// Human-readable label for the current filter set, e.g.
//   "Popular Movies", "Action Movies of 2024", "2024 Japanese TV Shows".
// Used as the page <h1> and ItemList name so the schema matches the visible
// heading (Google requires schema to reflect on-page content).
export function filtersLabel(f: BrowseFilters): string {
  const typeLabel = f.type === 'tv' ? 'TV Shows' : 'Movies';
  const genreName = GENRES.find(([v]) => v === f.genre)?.[1];
  const countryName = COUNTRIES.find(([v]) => v === f.country)?.[1];
  const sortLabel = SORTS.find(([v]) => v === f.sort)?.[1] || 'Popular';
  const head = sortLabel === 'Popular' ? 'Popular' : '';
  const parts = [head, genreName, typeLabel].filter(Boolean).join(' ');
  const attrs = [f.year, countryName].filter(Boolean).join(', ');
  return attrs ? `${parts}${attrs ? ` (${attrs})` : ''}` : parts;
}
