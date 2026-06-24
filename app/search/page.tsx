import type { Metadata } from 'next';
import { searchMulti } from '@/lib/tmdb';
import PosterCard from '@/components/PosterCard';
import HeroSearch from '@/components/HeroSearch';

// Server-rendered search results. The query comes in via ?q= so the page is
// shareable and works without JS. Search-result pages are intentionally
// noindex,follow — standard SEO practice (avoids thin/duplicate indexable URLs)
// while still letting crawlers follow links out to the indexable detail pages.
export const runtime = 'edge';

type SearchParams = { q?: string };

export function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Metadata {
  const q = (searchParams.q || '').trim();
  return {
    title: q ? `Search results for “${q}”` : 'Search Free Movies & TV Shows',
    description: q
      ? `Watch free movies and TV shows matching “${q}” online in HD — no sign-up required.`
      : 'Search thousands of free movies, TV shows, anime, and Korean dramas to watch online in HD.',
    alternates: { canonical: '/search' },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = (searchParams.q || '').trim();
  const results = q ? await searchMulti(q).catch(() => []) : [];

  return (
    <div className="search-page">
      <div className="search-page-header">
        <h1>{q ? `Search results for “${q}”` : 'Search Free Movies & TV Shows'}</h1>
        <HeroSearch defaultQuery={q} />
        {q && (
          <p className="search-page-count">
            {results.length > 0
              ? `${results.length} title${results.length === 1 ? '' : 's'} found`
              : 'No titles found'}
          </p>
        )}
      </div>

      {!q && (
        <p className="search-page-empty">
          Type a movie, TV show, anime, or Korean drama above to start watching free in HD.
        </p>
      )}

      {q && results.length === 0 && (
        <p className="search-page-empty">
          No results for “{q}”. Try a different title or check the spelling.
        </p>
      )}

      {results.length > 0 && (
        <div className="browse-grid">
          {results.map((item) => (
            <PosterCard key={`${item.id}-${item.media_type ?? ''}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
