'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { TmdbItem, MediaType } from '@/lib/tmdb';
import {
  GENRES,
  COUNTRIES,
  SORTS,
  ITEMS_PER_PAGE,
  discoverParams,
  type BrowseFilters,
} from '@/lib/browse';
import PosterCard from './PosterCard';

// Browse view with genre/year/country/sort filters + pagination, ported from
// js/browse.js. Discover requests go through the /api/tmdb proxy. Initial filter
// values are read from the URL (?type=tv&genre=28 …) so links from the footer
// or elsewhere can deep-link straight into a filtered view.
//
// SSR seeding: the server page (app/browse/page.tsx) fetches the first page of
// results and passes them in as `initial` so (a) crawlers get crawlable HTML
// + an ItemList without executing JS, and (b) the first paint shows results
// immediately instead of a spinner-then-refetch. On any filter/page change we
// re-fetch through the proxy as normal.

interface InitialData {
  items: TmdbItem[];
  totalPages: number;
  filters: BrowseFilters;
}

export default function Browse({
  initial,
}: {
  initial?: InitialData;
}) {
  // Read initial filters from the URL so the page is deep-linkable
  // (e.g. footer "Watch TV Shows" → /browse?type=tv).
  const searchParams = useSearchParams();
  const router = useRouter();
  const [type, setType] = useState<MediaType>(
    initial?.filters.type ??
      ((searchParams.get('type') as MediaType) === 'tv' ? 'tv' : 'movie')
  );
  const [genre, setGenre] = useState(initial?.filters.genre ?? (searchParams.get('genre') || ''));
  const [year, setYear] = useState(initial?.filters.year ?? (searchParams.get('year') || ''));
  const [country, setCountry] = useState(
    initial?.filters.country ?? (searchParams.get('country') || '')
  );
  const [sort, setSort] = useState(
    initial?.filters.sort ?? (searchParams.get('sort') || 'popularity.desc')
  );
  const [page, setPage] = useState(initial?.filters.page ?? 1);
  const [totalPages, setTotalPages] = useState(initial?.totalPages ?? 0);
  const [items, setItems] = useState<TmdbItem[]>(initial?.items ?? []);
  const [loading, setLoading] = useState(!initial);

  const seededKey = initial
    ? `${initial.filters.type}|${initial.filters.genre}|${initial.filters.year}|${initial.filters.country}|${initial.filters.sort}|${initial.filters.page}`
    : '';
  const currentKey = `${type}|${genre}|${year}|${country}|${sort}|${page}`;
  // If the live filters still match the SSR-seeded view, we already have the
  // data — skip the first fetch entirely (avoids a duplicate request).
  const skipNext = !!initial && seededKey === currentKey;

  const years = [
    ['', 'All Years'],
    ...Array.from({ length: 101 }, (_, i) => {
      const y = String(new Date().getFullYear() - i);
      return [y, y] as [string, string];
    }),
  ];

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = discoverParams({ type, genre, year, country, sort, page });
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`/api/tmdb/discover/${type}?${qs}`);
      const data = await res.json();
      setTotalPages(Math.ceil((data.total_results || 0) / ITEMS_PER_PAGE));
      setItems((data.results || []).slice(0, ITEMS_PER_PAGE));
    } finally {
      setLoading(false);
    }
  }, [type, genre, year, country, sort, page]);

  useEffect(() => {
    if (skipNext) return;
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchContent, skipNext]);

  // Keep the URL in sync with the active filters so the current view is
  // shareable/bookmarkable. Skips empty values to keep it tidy.
  useEffect(() => {
    const params = new URLSearchParams();
    if (type !== 'movie') params.set('type', type);
    if (genre) params.set('genre', genre);
    if (year) params.set('year', year);
    if (country) params.set('country', country);
    if (sort !== 'popularity.desc') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(qs ? `/browse?${qs}` : '/browse', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, genre, year, country, sort, page]);

  // Reset to page 1 whenever a filter (not the page) changes.
  const onFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  return (
    <div id="browse-content" className="content-area" style={{ display: 'block' }}>
      <div className="filters-container">
        <div className="filter-group">
          <label>Content Type</label>
          <select value={type} onChange={(e) => onFilter((v) => setType(v as MediaType))(e.target.value)}>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Genre</label>
          <select value={genre} onChange={(e) => onFilter(setGenre)(e.target.value)}>
            {GENRES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Year</label>
          <select value={year} onChange={(e) => onFilter(setYear)(e.target.value)}>
            {years.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Country</label>
          <select value={country} onChange={(e) => onFilter(setCountry)(e.target.value)}>
            {COUNTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Sort By</label>
          <select value={sort} onChange={(e) => onFilter(setSort)(e.target.value)}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading-spinner" style={{ display: 'flex' }}>
          <div className="spinner" />
          <p>Loading content...</p>
        </div>
      )}

      <div className={`browse-results ${loading ? 'is-loading' : ''}`} style={{ display: loading ? 'none' : 'block' }}>
        <div className="browse-grid grid-reveal">
          {items.map((item) => (
            <PosterCard key={item.id} item={{ ...item, media_type: type }} />
          ))}
        </div>
      </div>

      <div className="pagination">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          &laquo; Prev
        </button>
        <div className="page-numbers">
          <span className="page-info">Page {page} of {totalPages}</span>
        </div>
        <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
          Next &raquo;
        </button>
      </div>
    </div>
  );
}
