'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getWatchlist, WATCHLIST_EVENT } from '@/lib/watchlist';
import { openSurpriseModal } from './SurpriseModal';
import Icon from './Icon';
import { SearchDropdown, useLiveSearch } from './SearchDropdown';

// Navbar: logo, Home + Browse links, live multi-search (via /api/tmdb proxy),
// and the live HUD clock. Search results appear in a compact floating dropdown
// (not a full-page takeover) with ↑/↓ keyboard navigation and a "see all
// results" link into the full /search results page.

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [browseType, setBrowseType] = useState<string | null>(null); // ?type= on /browse
  const [watchlistCount, setWatchlistCount] = useState(0);
  const clockRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const {
    query,
    setQuery,
    clear,
    results,
    filteredResults,
    searching,
    activeIndex,
    setActiveIndex,
    searchFilter,
    setSearchFilter,
    containerRef,
    inputRef,
    openResult,
    closeDropdown,
    onKeyDown,
  } = useLiveSearch({ onAfterSelect: closeMobile });

  useEffect(() => {
    const sync = () => setWatchlistCount(getWatchlist().length);
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // The welcome landing (/) has its own large hero search, so the compact
  // navbar search is redundant there — hide it on that route only.
  const showSearch = pathname !== '/';

  // Track the /browse ?type= query so the matching nav link can show its active
  // state. Read from window.location on mount/route change (not useSearchParams,
  // which would force the whole page into client-side rendering).
  useEffect(() => {
    if (pathname !== '/browse') {
      setBrowseType(null);
      return;
    }
    setBrowseType(new URLSearchParams(window.location.search).get('type'));
  }, [pathname]);

  // Live HUD clock for the navbar ID rail. Writes directly to the DOM via a ref
  // (not React state) so the per-second tick never triggers a re-render.
  useEffect(() => {
    const el = clockRef.current;
    if (!el) return;
    const tick = () => { el.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false }); };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <header className="navbar">
        <div className="nav-idrail" aria-hidden="true">
          JUSTFLIX // FREE_STREAM_TERMINAL // <b ref={clockRef}>--:--:--</b>
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
          <Link href="/home" className={`nav-link-secondary ${pathname === '/home' ? 'active' : ''}`}>
            Home
          </Link>
          <Link
            href="/browse?type=movie"
            className={`nav-link-secondary ${pathname === '/browse' && browseType === 'movie' ? 'active' : ''}`}
          >
            Movies
          </Link>
          <Link
            href="/browse?type=tv"
            className={`nav-link-secondary ${pathname === '/browse' && browseType === 'tv' ? 'active' : ''}`}
          >
            TV Shows
          </Link>
          {/* Crawlable <a> (was a <button> + router.push, which crawlers can't
              follow). Carries the same .browse-btn HUD styling so the look is
              unchanged; the hover/active states are handled by :hover/:active. */}
          <Link
            href="/browse"
            className={`browse-btn ${pathname === '/browse' && !browseType ? 'active' : ''}`}
          >
            Browse <Icon name="film" />
          </Link>
          <button
            type="button"
            className="nav-surprise-btn"
            onClick={openSurpriseModal}
            title="Random Title Picker"
          >
            <Icon name="dice" /> <span>Surprise Me</span>
          </button>
          <Link
            href="/home#my-watchlist-section"
            className="nav-link-secondary nav-watchlist-link"
          >
            <Icon name="bookmark" /> <span>Watchlist</span>
            {watchlistCount > 0 && <span className="nav-watchlist-badge">{watchlistCount}</span>}
          </Link>
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
                <Icon name="search" />
              </button>
              <div className="search-bar-wrap">
                <input
                  ref={inputRef}
                  type="text"
                  className="search-bar"
                  placeholder="Search titles, cast, directors..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  role="combobox"
                  aria-expanded={results !== null && filteredResults.length > 0}
                  aria-controls="navbar-search-results"
                  aria-autocomplete="list"
                  aria-activedescendant={
                    activeIndex >= 0 && filteredResults[activeIndex]
                      ? `nav-search-${filteredResults[activeIndex].id}`
                      : undefined
                  }
                />
                {query && (
                  <button
                    type="button"
                    className="search-clear-icon-btn"
                    onClick={() => {
                      clear();
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                  >
                    <Icon name="times" />
                  </button>
                )}
              </div>

              {/* Compact dropdown (absolute, capped height) instead of a
                  full-page takeover. Stays anchored under the search field. */}
              <SearchDropdown
                id="navbar-search-results"
                idPrefix="nav-search"
                query={query}
                results={results}
                filteredResults={filteredResults}
                searching={searching}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                searchFilter={searchFilter}
                setSearchFilter={setSearchFilter}
                onSelect={openResult}
                onSeeAll={() => {
                  closeDropdown();
                  setMobileOpen(false);
                }}
              />
            </div>
          )}
        </nav>
      </header>
    </>
  );
}
