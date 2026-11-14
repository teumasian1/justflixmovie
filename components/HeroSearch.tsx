'use client';

import Icon from './Icon';
import { SearchDropdown, useLiveSearch } from './SearchDropdown';

// Prominent hero search box for the landing page. A real <form> with a GET
// action so it works without JS (lands on /search?q=…); progressively enhanced
// with a debounced live-search dropdown and keyboard navigation. `defaultQuery`
// lets the search page reuse this component with the current term pre-filled.

export default function HeroSearch({ defaultQuery = '' }: { defaultQuery?: string }) {
  const {
    query,
    setQuery,
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
    navigateToSearch,
    onKeyDown,
  } = useLiveSearch({ initialQuery: defaultQuery });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToSearch();
  };

  return (
    <div ref={containerRef} className="hero-search-wrap">
      <form className="hero-search" role="search" action="/search" method="get" onSubmit={submit}>
        <Icon name="search" className="hero-search-icon" />
        <input
          ref={inputRef}
          type="search"
          name="q"
          className="hero-search-input"
          placeholder="Search movies, TV shows, directors, actors…"
          aria-label="Search movies, TV shows, actors and directors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          role="combobox"
          aria-expanded={results !== null && filteredResults.length > 0}
          aria-controls="hero-search-results"
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && filteredResults[activeIndex]
              ? `hero-search-${filteredResults[activeIndex].id}`
              : undefined
          }
        />
        <button type="submit" className="hero-search-btn">
          Search
        </button>
      </form>

      <SearchDropdown
        id="hero-search-results"
        idPrefix="hero-search"
        className="hero-search-dropdown"
        query={query}
        results={results}
        filteredResults={filteredResults}
        searching={searching}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        onSelect={openResult}
        onSeeAll={closeDropdown}
      />
    </div>
  );
}
