import type { Metadata } from 'next';
import type { TmdbItem, MediaType } from './tmdb';
import { IMG_URL } from './tmdb';
import { titleOf, yearOf, buildHref } from './slug';
import { filterBanned } from './banned';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.justflixmovies.online';

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

// --- JSON-LD helpers ---

// The US maturity rating for a title, sourced from the enriched detail response.
// Movies carry release_dates (we prefer the digital/home-video release type so
// we get the rating a streamer would show, not the theatrical one); TV carries
// content_ratings. Returns undefined if there's no US rating rather than "".
function usRating(item: TmdbItem, type: MediaType): string | undefined {
  if (type === 'movie') {
    const us = (item.release_dates?.results || []).find(
      (r) => r.iso_3166_1 === 'US'
    );
    if (!us) return undefined;
    // Pick the most relevant release: prefer type 4 (digital) > 5 (physical) >
    // 6 (TV), the home-viewing categories; fall back to the first available.
    const rd = us.release_dates || [];
    const pick =
      rd.find((r) => r.type === 4 && r.certification) ||
      rd.find((r) => r.type === 5 && r.certification) ||
      rd.find((r) => r.type === 6 && r.certification) ||
      rd.find((r) => r.certification);
    const c = pick?.certification?.trim();
    return c || undefined;
  }
  const us = (item.content_ratings?.results || []).find(
    (r) => r.iso_3166_1 === 'US'
  );
  const c = us?.rating?.trim();
  return c || undefined;
}

// The "official" YouTube trailer key, preferring official+Trailer/Teaser. TMDB
// returns many video entries (clips, featurettes, foreign dubs); for schema we
// want the canonical trailer so the rich result links to the right video.
function trailerKey(item: TmdbItem): string | undefined {
  const vids = item.videos?.results || [];
  if (!vids.length) return undefined;
  const score = (v: { type: string; official?: boolean }) =>
    (v.official ? 2 : 0) + (v.type === 'Trailer' ? 2 : v.type === 'Teaser' ? 1 : 0);
  const best = [...vids]
    .filter((v) => v.site === 'YouTube' && v.key)
    .sort((a, b) => score(b) - score(a))[0];
  return best?.key;
}

// Movie/TVSeries JSON-LD for crawlers. Enriched (when called with the
// getDetailsEnriched() response) it emits the fields Google's Movie rich result
// explicitly looks for: director, actor, trailer, contentRating, plus a proper
// ImageObject for the poster. All enrichment is optional — a plain getDetails()
// response degrades gracefully to name/description/image/rating as before.
export function buildJsonLd(type: MediaType, item: TmdbItem, path: string) {
  const title = titleOf(item);
  const poster = item.poster_path ? `${IMG_URL}${item.poster_path}` : '/placeholder.jpg';
  const url = `${SITE_URL}${path}`;

  // Cast & crew come back as flat arrays; pull out the canonical director(s)
  // (movies) / creator(s) (TV) and the top-billed cast for schema.
  const crew = item.credits?.crew || [];
  const cast = (item.credits?.cast || []).slice(0, 5);
  const directors =
    type === 'movie'
      ? crew.filter((c) => c.job === 'Director')
      : crew.filter((c) =>
          ['Creator', 'Series Creator', 'Executive Producer'].includes(c.job || '')
        );

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type === 'tv' ? 'TVSeries' : 'Movie',
    name: title,
    description: item.overview || `Watch ${title} online free in HD.`,
    // ImageObject (with explicit dimensions) instead of a bare string: Google
    // requires this form for the Movie rich result's image eligibility.
    image: {
      '@type': 'ImageObject',
      url: poster,
      width: 500,
      height: 750,
    },
    url,
    datePublished: item.release_date || item.first_air_date || undefined,
    genre: (item.genres || []).map((g) => g.name),
  };

  // contentRating — only set when we actually resolved a US rating.
  const rating = usRating(item, type);
  if (rating) jsonLd.contentRating = rating;

  if (directors.length) {
    jsonLd[type === 'tv' ? 'creator' : 'director'] = directors.slice(0, 2).map((d) => ({
      '@type': 'Person',
      name: d.name,
      ...(d.profile_path
        ? { image: `https://image.tmdb.org/t/p/w185${d.profile_path}` }
        : {}),
    }));
  }
  if (cast.length) {
    jsonLd.actor = cast.map((c) => ({
      '@type': 'Person',
      name: c.name,
      ...(c.profile_path
        ? { image: `https://image.tmdb.org/t/p/w185${c.profile_path}` }
        : {}),
    }));
  }

  const key = trailerKey(item);
  if (key) {
    jsonLd.trailer = {
      '@type': 'VideoObject',
      name: `${title} Trailer`,
      thumbnailUrl: item.backdrop_path
        ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
        : poster,
      contentUrl: `https://www.youtube.com/watch?v=${key}`,
      uploadDate: item.release_date || item.first_air_date || undefined,
      embedUrl: `https://www.youtube.com/embed/${key}`,
    };
  }

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

// BreadcrumbList schema: Home › {Movies|TV Shows} › {Title}. Mirrors the
// visible breadcrumb so Google can render the breadcrumb trail in the SERP.
export function buildBreadcrumbJsonLd(
  type: MediaType,
  item: TmdbItem,
  path: string
) {
  const title = titleOf(item);
  const sectionLabel = type === 'tv' ? 'TV Shows' : 'Movies';
  const sectionPath = type === 'tv' ? '/browse?type=tv' : '/browse?type=movie';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: sectionLabel,
        item: `${SITE_URL}${sectionPath}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `${SITE_URL}${path}`,
      },
    ],
  };
}

// ItemList schema for a row/grid of titles. Used by the homepage trending rows
// and the browse results grid so Google can render a carousel rich result.
// Each entry points at the title's real detail URL (via the same buildHref()
// the rest of the app uses) so link equity flows and the JSON-LD URLs can never
// drift from the live <a> links.
export function buildItemListJsonLd(items: TmdbItem[], listName: string) {
  // Defense-in-depth: strip banned ids here too so carousel JSON-LD can never
  // leak them even if an upstream caller forgets to filter.
  const safe = filterBanned(items);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: safe.length,
    itemListElement: safe
      .filter((i) => i.poster_path && i.id)
      .slice(0, 30)
      .map((item, idx) => {
        const type: MediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        const title = titleOf(item);
        return {
          '@type': 'ListItem',
          position: idx + 1,
          name: title,
          url: `${SITE_URL}${buildHref(type, { id: item.id, title: item.title, name: item.name })}`,
          ...(item.poster_path
            ? { image: `https://image.tmdb.org/t/p/w500${item.poster_path}` }
            : {}),
        };
      }),
  };
}
