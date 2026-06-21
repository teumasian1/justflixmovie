import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDetails } from '@/lib/tmdb';
import { idFromSlug } from '@/lib/slug';
import { buildDetailMetadata } from '@/lib/detail';
import DetailView from '@/components/DetailView';

// SSR per TV title.
export const runtime = 'edge';
export const revalidate = 86400;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const id = idFromSlug(params.slug);
  if (!id) return {};
  try {
    const item = await getDetails('tv', id);
    return buildDetailMetadata('tv', item, `/tv/${params.slug}`);
  } catch {
    return {};
  }
}

export default async function TvPage({ params }: Params) {
  const id = idFromSlug(params.slug);
  if (!id) notFound();
  const item = await getDetails('tv', id).catch(() => null);
  if (!item) notFound();
  return <DetailView type="tv" item={item} path={`/tv/${params.slug}`} />;
}
