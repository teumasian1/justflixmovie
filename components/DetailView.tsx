import type { TmdbItem, MediaType } from '@/lib/tmdb';
import { IMG_URL } from '@/lib/tmdb';
import { titleOf, yearOf } from '@/lib/slug';
import { runtimeLabel, buildJsonLd } from '@/lib/detail';
import AutoOpen from './AutoOpen';

// Server-rendered SEO content for a movie/tv title: visible poster + heading +
// synopsis (so Google indexes real content on first crawl) plus JSON-LD. The
// client <AutoOpen> then launches the player modal over it.

export default function DetailView({
  type,
  item,
  path,
}: {
  type: MediaType;
  item: TmdbItem;
  path: string;
}) {
  const title = titleOf(item);
  const year = yearOf(item.release_date || item.first_air_date);
  const poster = item.poster_path ? `${IMG_URL}${item.poster_path}` : '/placeholder.jpg';
  const overview = item.overview || `Watch ${title} online free in HD on JustFlixMovies.`;
  const genres = (item.genres || []).map((g) => g.name).join(', ');
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const typeLabel = type === 'tv' ? 'TV Series' : 'Movie';
  const metaLine = [typeLabel, genres, rating ? `⭐ ${rating}/10` : '', runtimeLabel(item, type)]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(type, item, path)) }}
      />
      <section className="detail-seo" aria-label={`${title} details`}>
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
      <AutoOpen item={item} type={type} />
    </>
  );
}
