'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { IMG_URL, type TmdbItem } from '@/lib/tmdb';
import { useModal } from './ModalContext';

// Navbar: logo, Home + Browse links, live multi-search (via /api/tmdb proxy),
// and the live HUD clock. Search results appear in a compact floating dropdown
// (not a full-page takeover) with ↑/↓ keyboard navigation and a "see all
// results" link into the full /search results page.

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // keyboard-focused result
  const [clock, setClock] = useState('--:--:--');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
      setActiveIndex(-1);
      return;
    }
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        // Keep only titles with a poster; cap the dropdown at 6 for a tidy list.
        const top = (data.results || [])
          .filter((i: TmdbItem) => i.poster_path)
          .slice(0, 6);
        setResults(top);
        setActiveIndex(top.length ? 0 : -1);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setResults(null);
        setActiveIndex(-1);
        setMobileOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Open a result: in-app modal for an instant launch, then close the dropdown.
  const openResult = (item: TmdbItem) => {
    open(item);
    setQuery('');
    setResults(null);
    setActiveIndex(-1);
    setMobileOpen(false);
    inputRef.current?.blur();
  };

  // Keyboard navigation inside the dropdown: ↑/↓ move, Enter opens (or jumps to
  // the full results page when none is focused), Escape closes.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) openResult(target);
      else router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else if (e.key === 'Escape') {
      setResults(null);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="nav-idrail" aria-hidden="true">
          JUSTFLIX // FREE_STREAM_TERMINAL // <b>{clock}</b>
        </div>
        <Link href="/">
          {/*
            Responsive logo. Rendered at ~81×54 CSS px, so we serve right-sized
            variants via srcset (96/192/288 = 1x/2x/3x density) instead of the
            full 1536×1024 source. Cuts the navbar logo download from ~179KB to
            ~1–4KB. The 96px is the 1x fallback for srcset-unaware browsers.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lulu-96.png"
            srcSet="/lulu-96.png 96w, /lulu-192.png 192w, /lulu-288.png 288w"
            sizes="84px"
            alt="JustFlixMovies"
            width={81}
            height={54}
            style={{ cursor: 'pointer' }}
            id="logo"
          />
        </Link>
        <nav className="nav-links">
          <Link href="/home" className={pathname === '/home' ? 'active' : ''}>
            Home
          </Link>
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
                  if (!mobileOpen) setTimeout(() => inputRef.current?.focus(), 60);
                }}
              >
                <i className="fas fa-search" />
              </button>
              <input
                ref={inputRef}
                type="text"
                className="search-bar"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                aria-expanded={results !== null && results.length > 0}
                aria-controls="navbar-search-results"
                aria-autocomplete="list"
                aria-activedescendant={
                  activeIndex >= 0 && results && results[activeIndex]
                    ? `nav-search-${results[activeIndex].id}`
                    : undefined
                }
              />

              {/* Compact dropdown (absolute, capped height) instead of a
                  full-page takeover. Stays anchored under the search field. */}
              {results !== null && (
                <div className="nav-search-dropdown" id="navbar-search-results" role="listbox">
                  {searching && (
                    <div className="nav-search-status">
                      <span className="spinner spinner-sm" /> Searching…
                    </div>
                  )}
                  {!searching && results.length === 0 && (
                    <div className="nav-search-status">No results found</div>
                  )}
                  {!searching &&
                    results.map((item, i) => (
                      <button
                        key={item.id}
                        id={`nav-search-${item.id}`}
                        type="button"
                        role="option"
                        aria-selected={i === activeIndex}
                        className={`nav-search-item ${i === activeIndex ? 'is-active' : ''}`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => openResult(item)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="nav-search-poster"
                          width={92}
                          height={138}
                          src={`${IMG_URL}${item.poster_path}`}
                          alt=""
                        />
                        <span className="nav-search-info">
                          <span className="nav-search-title">{item.title || item.name}</span>
                          <span className="nav-search-type">
                            {item.media_type === 'tv' || item.first_air_date
                              ? 'TV Series'
                              : 'Movie'}
                            {item.release_date || item.first_air_date
                              ? ` · ${new Date(item.release_date || item.first_air_date || '').getFullYear()}`
                              : ''}
                          </span>
                        </span>
                      </button>
                    ))}
                  {!searching && results.length > 0 && (
                    <Link
                      className="nav-search-all"
                      href={`/search?q=${encodeURIComponent(query.trim())}`}
                      onClick={() => {
                        setResults(null);
                        setMobileOpen(false);
                      }}
                    >
                      See all results for “{query.trim()}” <i className="fas fa-arrow-right" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>
      </header>
    </>
  );
}
