'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';

// Prominent hero search box for the landing page. A real <form> with a GET
// action so it works without JS (lands on /search?q=…); progressively enhanced
// to push the route client-side. `defaultQuery` lets the search page reuse this
// component with the current term pre-filled.

export default function HeroSearch({ defaultQuery = '' }: { defaultQuery?: string }) {
  const [query, setQuery] = useState(defaultQuery);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form className="hero-search" role="search" action="/search" method="get" onSubmit={submit}>
      <Icon name="search" className="hero-search-icon" />
      <input
        type="search"
        name="q"
        className="hero-search-input"
        placeholder="Search movies, TV shows, directors, actors…"
        aria-label="Search movies, TV shows, actors and directors"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      <button type="submit" className="hero-search-btn">
        Search
      </button>
    </form>
  );
}
