import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDetailsEnriched, getRecommendations } from '@/lib/tmdb';
import { idFromSlug } from '@/lib/slug';
import { isBannedId } from '@/lib/banned';
import { buildDetailMetadata } from '@/lib/detail';
import DetailView from '@/components/DetailView';

// SSR per TV title. Enriched detail (credits/videos/rating for JSON-LD) plus a
// parallel recommendations fetch for the "More Like This Series" row.
export const runtime = 'edge';
export const revalidate = 86400;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const id = idFromSlug(params.slug);
  if (!id || isBannedId(id)) return {};
  try {
    const item = await getDetailsEnriched('tv', id);
    return buildDetailMetadata('tv', item, `/tv/${params.slug}`);
  } catch {
    return {};
  }
}

export default async function TvPage({ params }: Params) {
  const id = idFromSlug(params.slug);
  if (!id || isBannedId(id)) notFound();
  const [item, related] = await Promise.all([
    getDetailsEnriched('tv', id).catch(() => null),
    getRecommendations('tv', id),
  ]);
  if (!item) notFound();
  return (
    <DetailView type="tv" item={item} path={`/tv/${params.slug}`} related={related} />
  );
}
