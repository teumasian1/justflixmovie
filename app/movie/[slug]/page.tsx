import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDetails } from '@/lib/tmdb';
import { idFromSlug } from '@/lib/slug';
import { buildDetailMetadata } from '@/lib/detail';
import DetailView from '@/components/DetailView';

// SSR + ISR per movie title. generateMetadata emits a unique title/description/
// canonical/OG so each movie indexes as its own page.
export const revalidate = 86400;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const id = idFromSlug(params.slug);
  if (!id) return {};
  try {
    const item = await getDetails('movie', id);
    return buildDetailMetadata('movie', item, `/movie/${params.slug}`);
  } catch {
    return {};
  }
}

export default async function MoviePage({ params }: Params) {
  const id = idFromSlug(params.slug);
  if (!id) notFound();
  const item = await getDetails('movie', id).catch(() => null);
  if (!item) notFound();
  return <DetailView type="movie" item={item} path={`/movie/${params.slug}`} />;
}
