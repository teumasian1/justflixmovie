'use client';

import { useRef, useState } from 'react';
import { IMG_URL, type TmdbItem } from '@/lib/tmdb';
import { useModal } from './ModalContext';
import { launchFromPoster } from './launch';
import StarRating from './StarRating';

// A single poster tile with the hover overlay (title / stars / year / synopsis)
// and the always-visible rating badge. Clicking runs the launch animation and
// opens the player modal — same behaviour as the original displayList().

export default function PosterCard({ item }: { item: TmdbItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const { open } = useModal();

  if (!item.poster_path) return null;

  const title = item.title || item.name || '';
  const dateStr = item.release_date || item.first_air_date;
  const year = dateStr ? new Date(dateStr).getFullYear() : null;
  const rating = typeof item.vote_average === 'number' ? item.vote_average : 0;

  const handleClick = () => {
    launchFromPoster(ref.current, (typeDelay) => open(item, { typeDelay }));
  };

  return (
    <div
      ref={ref}
      className={`poster-container ${loaded ? 'loaded' : 'loading'}`}
      onClick={handleClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        loading="lazy"
        src={`${IMG_URL}${item.poster_path}`}
        alt={title}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          setLoaded(true);
          (e.target as HTMLImageElement).src = '/placeholder.jpg';
        }}
      />
      {rating > 0 && (
        <div className="poster-badge">
          <i className="fas fa-star" />
          {rating.toFixed(1)}
        </div>
      )}
      <div className="poster-overlay">
        <h3 className="poster-title">{title}</h3>
        <StarRating rating={rating * 10} />
        <div className="poster-year">{year ?? 'N/A'}</div>
        <div className="poster-description">{item.overview}</div>
      </div>
    </div>
  );
}
