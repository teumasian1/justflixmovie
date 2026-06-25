import type { Metadata } from 'next';
import { Suspense } from 'react';
import { discover } from '@/lib/tmdb';
import type { TmdbItem } from '@/lib/tmdb';
import {
  filtersFromParams,
  discoverParams,
  filtersLabel,
  ITEMS_PER_PAGE,
  type BrowseFilters,
} from '@/lib/browse';
import { buildItemListJsonLd } from '@/lib/detail';
import Browse from '@/components/Browse';

// Server-rendered browse. The first page of discover results is fetched on the
// edge so crawlers get crawlable poster <a> links + an ItemList in the initial
// HTML, and the first paint shows results instead of a spinner. The client
// <Browse> then hydrates against that seed and re-fetches only when a filter or
// page actually changes.

export const runtime = 'edge';
export const revalidate = 3600;

// Dynamic metadata keyed to the active filters — each filter combination gets a
// descriptive title (e.g. "Popular Action Movies of 2024"), so genre/year
// landing pages are distinct indexable URLs rather than one generic /browse.
type Sp = { searchParams: Record<string, string | string[] | undefined> };

// Canonical URL for the active filter set. Only `type`/`genre`/`year`/`country`
// produce genuinely distinct indexable content; `sort` (same content, reordered)
// and `page` (paginated) are excluded so all sort/page variants canonicalize to
// the one filter-specific URL. Previously every filter combo collapsed onto
// /browse, which told Google they were all duplicates — hiding dozens of
// keyword-targetable category pages (e.g. "action movies 2024").
function browseCanonical(f: BrowseFilters): string {
  const c = new URLSearchParams();
  c.set('type', f.type);
  if (f.genre) c.set('genre', f.genre);
  if (f.year) c.set('year', f.year);
  if (f.country) c.set('country', f.country);
  return `/browse?${c.toString()}`;
}

export function generateMetadata({ searchParams }: Sp): Metadata {
  // normalize searchParams (Next may hand us arrays for repeated keys)
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === 'string') sp.set(k, v);
    else if (Array.isArray(v) && v[0]) sp.set(k, v[0]);
  }
  const f = filtersFromParams(sp);
  const label = filtersLabel(f);
  return {
    title: `${label} — Watch Free Online`,
    description: `${label} available to stream free in HD on JustFlixMovies — no sign-up, no subscription. Filter by genre, year, country, and rating.`,
    alternates: { canonical: browseCanonical(f) },
    robots: { index: true, follow: true },
  };
}

export default async function BrowsePage({ searchParams }: Sp) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === 'string') sp.set(k, v);
    else if (Array.isArray(v) && v[0]) sp.set(k, v[0]);
  }
  const filters = filtersFromParams(sp);
  const label = filtersLabel(filters);

  // Fetch the first page on the server. A failure degrades to an empty seed —
  // the client component will retry via the proxy.
  let items: TmdbItem[] = [];
  let totalPages = 0;
  try {
    const data = await discover(filters.type, discoverParams(filters));
    items = (data.results || []).slice(0, ITEMS_PER_PAGE);
    totalPages = Math.ceil((data.total_results || 0) / ITEMS_PER_PAGE);
  } catch {
    /* empty seed; client will refetch */
  }

  const itemList = buildItemListJsonLd(
    items.map((i) => ({ ...i, media_type: filters.type })),
    label
  );

  return (
    <>
      <h1 className="browse-page-title" style={{ padding: '0 4%', marginTop: '2rem' }}>
        {label}
      </h1>
      <Suspense
        fallback={<div className="loading-spinner" style={{ display: 'flex' }}><div className="spinner" /></div>}
      >
        <Browse initial={{ items, totalPages, filters }} />
      </Suspense>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </>
  );
}
