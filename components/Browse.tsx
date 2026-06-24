'use client';

import { useEffect, useState, useCallback } from 'react';
import type { TmdbItem, MediaType } from '@/lib/tmdb';
import PosterCard from './PosterCard';

// Browse view with genre/year/country/sort filters + pagination, ported from
// js/browse.js. Discover requests go through the /api/tmdb proxy.

const GENRES = [
  ['', 'All Genres'], ['28', 'Action'], ['12', 'Adventure'], ['16', 'Animation'],
  ['35', 'Comedy'], ['80', 'Crime'], ['99', 'Documentary'], ['18', 'Drama'],
  ['10751', 'Family'], ['14', 'Fantasy'], ['36', 'History'], ['27', 'Horror'],
  ['10402', 'Music'], ['9648', 'Mystery'], ['10749', 'Romance'],
  ['878', 'Science Fiction'], ['53', 'Thriller'],
];
const COUNTRIES = [
  ['', 'All Countries'], ['US', 'United States'], ['GB', 'United Kingdom'],
  ['FR', 'France'], ['DE', 'Germany'], ['IT', 'Italy'], ['ES', 'Spain'],
  ['JP', 'Japan'], ['KR', 'South Korea'], ['IN', 'India'], ['CN', 'China'],
];
const SORTS = [
  ['popularity.desc', 'Popularity'],
  ['vote_average.desc', 'Rating'],
  ['release_date.desc', 'Release Date'],
];
const ITEMS_PER_PAGE = 36;

export default function Browse() {
  const [type, setType] = useState<MediaType>('movie');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [country, setCountry] = useState('');
  const [sort, setSort] = useState('popularity.desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [items, setItems] = useState<TmdbItem[]>([]);
  const [loading, setLoading] = useState(false);

  const years = [
    ['', 'All Years'],
    ...Array.from({ length: 101 }, (_, i) => {
      const y = String(new Date().getFullYear() - i);
      return [y, y];
    }),
  ];

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), sort_by: sort });
      if (genre) params.set('with_genres', genre);
      if (year) params.set('year', year);
      if (country) params.set('with_origin_country', country);
      // Hide titles with no stream yet. For movies that means two things: a
      // release date that has already passed (no upcoming films), AND a release
      // that is digital/physical/TV (type 4|5|6) — i.e. actually out for home
      // streaming, not theatrical-only titles (type 2|3) still only in cinemas.
      // TV just needs to have aired (first air date on or before today).
      const today = new Date().toISOString().slice(0, 10);
      if (type === 'movie') {
        params.set('release_date.lte', today);
        params.set('with_release_type', '4|5|6');
      } else {
        params.set('first_air_date.lte', today);
      }
      const res = await fetch(`/api/tmdb/discover/${type}?${params.toString()}`);
      const data = await res.json();
      setTotalPages(Math.ceil((data.total_results || 0) / ITEMS_PER_PAGE));
      setItems((data.results || []).slice(0, ITEMS_PER_PAGE));
    } finally {
      setLoading(false);
    }
  }, [type, genre, year, country, sort, page]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

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

      <div className="browse-results" style={{ display: loading ? 'none' : 'block' }}>
        <div className="browse-grid">
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
