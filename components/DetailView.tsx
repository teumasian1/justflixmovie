import Link from 'next/link';
import type { TmdbItem, MediaType, TmdbCollection } from '@/lib/tmdb';
import { IMG_URL } from '@/lib/tmdb';
import { titleOf, yearOf } from '@/lib/slug';
import { runtimeLabel, synopsisOf, buildJsonLd, buildBreadcrumbJsonLd, buildItemListJsonLd, usRating, formatCurrency } from '@/lib/detail';
import Row from './Row';
import AutoOpen from './AutoOpen';
import DetailActions from './DetailActions';
import CommunityReactions from './CommunityReactions';

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
  collection = null,
  initialSeason,
  initialEpisode,
}: {
  type: MediaType;
  item: TmdbItem;
  path: string;
  related?: TmdbItem[];
  collection?: TmdbCollection | null;
  initialSeason?: number;
  initialEpisode?: number;
}) {
  const title = titleOf(item);
  const year = yearOf(item.release_date || item.first_air_date);
  const poster = item.poster_path ? `${IMG_URL}${item.poster_path}` : '/placeholder.jpg';
  const overview = synopsisOf(item, type);
  const genres = (item.genres || []).map((g) => g.name).join(', ');
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const typeLabel = type === 'tv' ? 'TV Series' : 'Movie';
  const certification = usRating(item, type);
  const budget = formatCurrency(item.budget);
  const boxOffice = formatCurrency(item.revenue);
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

  // Franchise parts if item belongs to a collection
  const collectionItems = (collection?.parts || [])
    .filter((p) => p.poster_path)
    .map((p) => ({ ...p, media_type: 'movie' as const }));

  const director = item.credits?.crew?.find((c) => c.job === 'Director');
  const cast = (item.credits?.cast || []).slice(0, 6);

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
            fetchPriority="high"
          />
          <div className="detail-seo-body">
            <h1>
              {title}
              {year ? <span> ({year})</span> : null}
            </h1>
            {metaLine && <p className="detail-seo-meta">{metaLine}</p>}
            <p className="detail-seo-overview">{overview}</p>
            {director && (
              <p className="detail-seo-person">
                <span className="person-label">Director:</span>{' '}
                <Link
                  href={`/search?q=${encodeURIComponent(director.name)}`}
                  className="person-link"
                >
                  {director.name}
                </Link>
              </p>
            )}
            {cast.length > 0 && (
              <div className="detail-seo-cast-row">
                <span className="person-label">Starring:</span>
                <div className="cast-chips-list">
                  {cast.map((actor) => (
                    <Link
                      key={actor.id}
                      href={`/search?q=${encodeURIComponent(actor.name)}`}
                      className="cast-chip-pill"
                    >
                      {actor.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {/* Telemetry specs badges */}
            <div className="detail-telemetry-specs">
              {certification && (
                <div className="spec-badge cert-badge">
                  <span className="spec-label">RATED</span>
                  <span className="spec-value">{certification}</span>
                </div>
              )}
              {item.status && (
                <div className="spec-badge">
                  <span className="spec-label">STATUS</span>
                  <span className="spec-value">{item.status}</span>
                </div>
              )}
              {item.original_language && (
                <div className="spec-badge">
                  <span className="spec-label">ORIGIN</span>
                  <span className="spec-value">{item.original_language.toUpperCase()}</span>
                </div>
              )}
              {budget && (
                <div className="spec-badge">
                  <span className="spec-label">BUDGET</span>
                  <span className="spec-value">{budget}</span>
                </div>
              )}
              {boxOffice && (
                <div className="spec-badge">
                  <span className="spec-label">BOX OFFICE</span>
                  <span className="spec-value">{boxOffice}</span>
                </div>
              )}
            </div>

            <DetailActions item={item} type={type} />
            <CommunityReactions itemId={item.id} />
            <p className="detail-seo-cta">
              Stream {title} online free in HD — no signup required, on JustFlixMovies.
            </p>
          </div>
        </div>
      </section>
      {collectionItems.length > 1 && (
        <Row
          title={collection?.name ? `Franchise: ${collection.name}` : 'Franchise Collection'}
          items={collectionItems}
        />
      )}
      {relatedItems.length > 0 && (
        <Row
          title={type === 'tv' ? 'More Like This Series' : 'More Like This'}
          items={relatedItems}
        />
      )}
      <AutoOpen
        item={item}
        type={type}
        initialSeason={initialSeason}
        initialEpisode={initialEpisode}
      />
    </>
  );
}
