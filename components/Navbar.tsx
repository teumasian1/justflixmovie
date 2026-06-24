'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { IMG_URL, type TmdbItem } from '@/lib/tmdb';
import { useModal } from './ModalContext';

// Navbar: logo, Browse link, live multi-search (via /api/tmdb proxy), and the
// 5-agent theme picker. Ported from the navbar + search logic in home.js.

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clock, setClock] = useState('--:--:--');
  const containerRef = useRef<HTMLDivElement>(null);
  const { open } = useModal();
  const router = useRouter();
  const pathname = usePathname();

  // The welcome landing (/) has its own large hero search, so the compact
  // navbar search is redundant there — hide it on that route only.
  const showSearch = pathname !== '/';

  // Live HUD clock for the navbar ID rail.
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Debounced search as the user types.
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults((data.results || []).filter((i: TmdbItem) => i.poster_path));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  // Close results when clicking outside.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setResults(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <>
      <header className="navbar">
        <div className="nav-idrail" aria-hidden="true">
          JUSTFLIX // FREE_STREAM_TERMINAL // <b>{clock}</b>
        </div>
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lulu.png" alt="JustFlixMovies" width={81} height={54} style={{ cursor: 'pointer' }} id="logo" />
        </Link>
        <nav className="nav-links">
          <button className="browse-btn" onClick={() => router.push('/browse')}>
            Browse <i className="fas fa-film" />
          </button>
          {showSearch && (
            <div
              ref={containerRef}
              role="search"
              className={`search-container ${mobileOpen ? 'is-open' : ''}`}
            >
              <button
                className="search-toggle"
                type="button"
                aria-label="Open search"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileOpen((v) => !v);
                }}
              >
                <i className="fas fa-search" />
              </button>
              <input
                type="text"
                className="search-bar"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
        </nav>
      </header>

      {showSearch && results !== null && (
        <div className="search-results-container" style={{ display: 'block' }}>
          <div className="browse-grid" id="navbar-search-results">
            {searching && (
              <div className="loading-spinner">
                <div className="spinner" />
                <p>Searching...</p>
              </div>
            )}
            {!searching && results.length === 0 && (
              <div className="no-results">No results found</div>
            )}
            {!searching &&
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="search-result-card"
                  aria-label={`Open ${item.title || item.name}`}
                  onClick={() => {
                    open(item);
                    setQuery('');
                    setResults(null);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="search-result-poster"
                    width={500}
                    height={750}
                    src={`${IMG_URL}${item.poster_path}`}
                    alt={item.title || item.name || ''}
                  />
                  <span className="search-result-title">{item.title || item.name}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
