import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getDetailsEnriched, getRecommendations } from '@/lib/tmdb';
import { idFromSlug, buildHref } from '@/lib/slug';
import { isBannedId } from '@/lib/banned';
import { buildDetailMetadata } from '@/lib/detail';
import DetailView from '@/components/DetailView';

// SSR per TV title. Enriched detail (credits/videos/rating for JSON-LD) plus a
// parallel recommendations fetch for the "More Like This Series" row.
export const dynamic = 'force-dynamic';

type Params = {
  params: { slug: string };
  searchParams?: { s?: string; e?: string };
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const id = idFromSlug(params.slug);
  if (!id || isBannedId(id)) return {};
  try {
    const item = await getDetailsEnriched('tv', id);
    // Always derive the canonical path from the item's title — never from the
    // incoming request slug — so every URL variant emits the same canonical.
    const canonicalPath = buildHref('tv', item);
    return buildDetailMetadata('tv', item, canonicalPath);
  } catch {
    return {};
  }
}

export default async function TvPage({ params, searchParams }: Params) {
  const id = idFromSlug(params.slug);
  if (!id || isBannedId(id)) notFound();
  const [item, related] = await Promise.all([
    getDetailsEnriched('tv', id).catch(() => null),
    getRecommendations('tv', id),
  ]);
  if (!item) notFound();
  // Enforce a single canonical URL: if the incoming slug doesn't match the
  // canonical slug derived from the title, 308-redirect. Collapses all variant
  // URLs (/tv/94605, /tv/wrong-title-94605, …) to one canonical path.
  const canonicalPath = buildHref('tv', item);
  if (canonicalPath !== `/tv/${params.slug}`) {
    permanentRedirect(canonicalPath);
  }
  const initialSeason = searchParams?.s ? Number(searchParams.s) : undefined;
  const initialEpisode = searchParams?.e ? Number(searchParams.e) : undefined;

  return (
    <DetailView
      type="tv"
      item={item}
      path={canonicalPath}
      related={related}
      initialSeason={Number.isFinite(initialSeason) ? initialSeason : undefined}
      initialEpisode={Number.isFinite(initialEpisode) ? initialEpisode : undefined}
    />
  );
}
