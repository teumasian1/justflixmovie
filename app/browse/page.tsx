import type { Metadata } from 'next';
import { Suspense } from 'react';
import Browse from '@/components/Browse';

export const metadata: Metadata = {
  // Root layout's template appends " | JustFlixMovies" (~17 chars), so keep the
  // base short enough that the full title stays under ~60 chars in SERPs.
  title: 'Browse Movies & TV Shows by Genre & Year',
  description:
    'Browse and filter free movies and TV shows by genre, release year, country, and popularity. Stream in HD with no registration on JustFlixMovies.',
  alternates: { canonical: '/browse' },
};

export default function BrowsePage() {
  // Suspense boundary required because <Browse> reads useSearchParams() during
  // render (Next.js opts the page into client-side search-param rendering).
  return (
    <Suspense fallback={<div className="loading-spinner" style={{ display: 'flex' }}><div className="spinner" /></div>}>
      <Browse />
    </Suspense>
  );
}
