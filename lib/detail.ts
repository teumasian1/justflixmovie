import type { Metadata } from 'next';
import type { TmdbItem, MediaType } from './tmdb';
import { IMG_URL } from './tmdb';
import { titleOf, yearOf } from './slug';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://justflixmovies.online';

function truncate(s: string, n = 160): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const cut = t.lastIndexOf(' ', n);
  return t.slice(0, cut > 0 ? cut : n).trim() + '…';
}

export function runtimeLabel(item: TmdbItem, type: MediaType): string {
  if (type === 'movie' && item.runtime) {
    const h = Math.floor(item.runtime / 60);
    const m = item.runtime % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }
  if (type === 'tv' && item.number_of_seasons) {
    return `${item.number_of_seasons} season${item.number_of_seasons > 1 ? 's' : ''}`;
  }
  return '';
}

// Per-title metadata, mirroring scripts/prerender.mjs buildPage().
export function buildDetailMetadata(
  type: MediaType,
  item: TmdbItem,
  path: string
): Metadata {
  const title = titleOf(item);
  const year = yearOf(item.release_date || item.first_air_date);
  const poster = item.poster_path ? `${IMG_URL}${item.poster_path}` : '/placeholder.jpg';
  const url = `${SITE_URL}${path}`;
  const overview = item.overview || `Watch ${title} online free in HD on JustFlixMovies.`;

  const base = `${title}${year ? ` (${year})` : ''}`;
  // OG/Twitter titles aren't length-constrained, so keep the fully descriptive
  // form there. The <title> tag, however, gets truncated in SERPs past ~60
  // chars — so drop the "Watch Free in HD" marketing tail when the full title
  // would overflow, always keeping the brand suffix.
  const ogTitle = `${base} - Watch Free in HD | JustFlixMovies`;
  const pageTitle = ogTitle.length <= 60 ? ogTitle : `${base} | JustFlixMovies`;
  const metaDesc = truncate(`Watch ${base} online free in HD. ${overview}`);

  // TMDB posters are served at the w500 size → 500×750 (2:3). Declaring the
  // dimensions lets social platforms render the card without a reflow/refetch.
  const ogImage = { url: poster, width: 500, height: 750 };

  return {
    // `absolute` opts out of the root layout's "%s | JustFlixMovies" template —
    // pageTitle already ends in the brand, so this avoids a doubled suffix.
    title: { absolute: pageTitle },
    description: metaDesc,
    alternates: { canonical: url },
    openGraph: {
      type: type === 'tv' ? 'video.tv_show' : 'video.movie',
      title: ogTitle,
      description: metaDesc,
      url,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: metaDesc,
      images: [ogImage],
    },
  };
}

// Movie/TVSeries JSON-LD for crawlers.
export function buildJsonLd(type: MediaType, item: TmdbItem, path: string) {
  const title = titleOf(item);
  const poster = item.poster_path ? `${IMG_URL}${item.poster_path}` : '/placeholder.jpg';
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type === 'tv' ? 'TVSeries' : 'Movie',
    name: title,
    description: item.overview || `Watch ${title} online free in HD.`,
    image: poster,
    url: `${SITE_URL}${path}`,
    datePublished: item.release_date || item.first_air_date || undefined,
    genre: (item.genres || []).map((g) => g.name),
  };
  if (item.vote_average && item.vote_count) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: item.vote_average,
      ratingCount: item.vote_count,
      bestRating: 10,
      worstRating: 0,
    };
  }
  return jsonLd;
}
