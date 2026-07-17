import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getDetailsEnriched, getRecommendations } from '@/lib/tmdb';
import { idFromSlug, buildHref } from '@/lib/slug';
import { isBannedId } from '@/lib/banned';
import { buildDetailMetadata } from '@/lib/detail';
import DetailView from '@/components/DetailView';

// SSR per movie title. generateMetadata emits a unique title/description/
// canonical/OG so each movie indexes as its own page. The page fetches the
// enriched detail (credits/videos/rating for JSON-LD) plus the recommendations
// list in parallel, so detail pages carry a "More Like This" row of internal
// links (good for crawl coverage) and a richer Movie schema.
export const runtime = 'edge';
export const revalidate = 86400;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const id = idFromSlug(params.slug);
  if (!id || isBannedId(id)) return {};
  try {
    const item = await getDetailsEnriched('movie', id);
    // Always derive the canonical path from the item's title — never from the
    // incoming request slug — so every URL variant emits the same canonical.
    const canonicalPath = buildHref('movie', item);
    return buildDetailMetadata('movie', item, canonicalPath);
  } catch {
    return {};
  }
}

export default async function MoviePage({ params }: Params) {
  const id = idFromSlug(params.slug);
  if (!id || isBannedId(id)) notFound();
  // Fetch the detail (enriched) and the recommendations list in parallel. A
  // failed recommendations fetch degrades to an empty row instead of breaking
  // the page.
  const [item, related] = await Promise.all([
    getDetailsEnriched('movie', id).catch(() => null),
    getRecommendations('movie', id),
  ]);
  if (!item) notFound();
  // Enforce a single canonical URL: if the incoming slug doesn't match the
  // canonical slug derived from the title, 308-redirect. Collapses all variant
  // URLs (/movie/83533, /movie/wrong-title-83533, …) to one canonical path.
  const canonicalPath = buildHref('movie', item);
  if (canonicalPath !== `/movie/${params.slug}`) {
    permanentRedirect(canonicalPath);
  }
  return (
    <DetailView type="movie" item={item} path={canonicalPath} related={related} />
  );
}
