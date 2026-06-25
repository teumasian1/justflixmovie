import Link from 'next/link';
import type { TmdbItem, MediaType } from '@/lib/tmdb';
import { IMG_URL } from '@/lib/tmdb';
import { titleOf, yearOf } from '@/lib/slug';
import { runtimeLabel, buildJsonLd, buildBreadcrumbJsonLd, buildItemListJsonLd } from '@/lib/detail';
import Row from './Row';
import AutoOpen from './AutoOpen';

// Server-rendered SEO content for a movie/tv title: visible poster + heading +
// synopsis (so Google indexes real content on first crawl) plus JSON-LD. The
// client <AutoOpen> then launches the player modal over it.
//
// `related` is the TMDB recommendations list; rendering it as a row of real
// <a> links here surfaces deep titles to crawlers (broadening crawlable
// coverage beyond the sitemap) and gives visitors a next-click.

export default function DetailView({
  type,
  item,
  path,
  related = [],
}: {
  type: MediaType;
  item: TmdbItem;
  path: string;
  related?: TmdbItem[];
}) {
  const title = titleOf(item);
  const year = yearOf(item.release_date || item.first_air_date);
  const poster = item.poster_path ? `${IMG_URL}${item.poster_path}` : '/placeholder.jpg';
  const overview = item.overview || `Watch ${title} online free in HD on JustFlixMovies.`;
  const genres = (item.genres || []).map((g) => g.name).join(', ');
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const typeLabel = type === 'tv' ? 'TV Series' : 'Movie';
  // Visible breadcrumb mirrors buildBreadcrumbJsonLd so the structured data
  // matches on-page content (Google Rich Results requirement). Home › Section › Title.
  const sectionLabel = type === 'tv' ? 'TV Shows' : 'Movies';
  const sectionPath = type === 'tv' ? '/browse?type=tv' : '/browse?type=movie';
  const metaLine = [typeLabel, genres, rating ? `⭐ ${rating}/10` : '', runtimeLabel(item, type)]
    .filter(Boolean)
    .join(' · ');

  // Tag related items with their media_type so PosterCard/Row link correctly.
  const relatedItems = related
    .filter((r) => r.poster_path && r.id !== item.id)
    .slice(0, 18)
    .map((r) => ({ ...r, media_type: type }));

  // ItemList over the "More Like This" recommendations: gives Google another
  // carousel signal and reinforces the semantic relationship between titles.
  // Only emit when there's at least one related title (empty ItemList is noise).
  const relatedList = relatedItems.length > 0 ? buildItemListJsonLd(relatedItems, `More Like ${title}`) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(type, item, path)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildBreadcrumbJsonLd(type, item, path)),
        }}
      />
      {relatedList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(relatedList) }}
        />
      )}
      <section className="detail-seo" aria-label={`${title} details`}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol className="breadcrumb-list">
            <li className="breadcrumb-item">
              <Link href="/">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href={sectionPath}>{sectionLabel}</Link>
            </li>
            <li className="breadcrumb-item" aria-current="page">
              {title}
            </li>
          </ol>
        </nav>
        <div className="detail-seo-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="detail-seo-poster"
            src={poster}
            alt={`${title} poster`}
            width={300}
            height={450}
          />
          <div className="detail-seo-body">
            <h1>
              {title}
              {year ? <span> ({year})</span> : null}
            </h1>
            {metaLine && <p className="detail-seo-meta">{metaLine}</p>}
            <p className="detail-seo-overview">{overview}</p>
            <p className="detail-seo-cta">
              Stream {title} online free in HD — no signup required, on JustFlixMovies.
            </p>
          </div>
        </div>
      </section>
      {relatedItems.length > 0 && (
        <Row
          title={type === 'tv' ? 'More Like This Series' : 'More Like This'}
          items={relatedItems}
        />
      )}
      <AutoOpen item={item} type={type} />
    </>
  );
}
