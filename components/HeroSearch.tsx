'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      <i className="fas fa-search hero-search-icon" aria-hidden="true" />
      <input
        type="search"
        name="q"
        className="hero-search-input"
        placeholder="Search movies, TV shows, anime…"
        aria-label="Search movies and TV shows"
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
