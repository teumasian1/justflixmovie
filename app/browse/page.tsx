import type { Metadata } from 'next';
import Browse from '@/components/Browse';

export const metadata: Metadata = {
  // Root layout's template appends " | JustFlixMovies".
  title: 'Browse Movies & TV Shows by Genre, Year & Country',
  description:
    'Browse and filter free movies and TV shows by genre, release year, country, and popularity. Stream in HD with no registration on JustFlixMovies.',
  alternates: { canonical: '/browse' },
};

export default function BrowsePage() {
  return <Browse />;
}
