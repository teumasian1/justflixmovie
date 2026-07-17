'use client';

import { useRef, useState, type MouseEvent } from 'react';
import { IMG_URL, type TmdbItem, type MediaType } from '@/lib/tmdb';
import { buildHref } from '@/lib/slug';
import { useModal } from './ModalContext';
import { launchFromPoster } from './launch';
import StarRating from './StarRating';
import Icon from './Icon';

// A single poster tile with the hover overlay (title / stars / year / synopsis)
// and the always-visible rating badge. Rendered as a real <a> linking to the
// title's detail page (so crawlers can follow it and link equity flows), but
// progressively enhanced: a plain left-click runs the launch animation and
// opens the player modal — same behaviour as the original displayList().
// Modified clicks (new tab, etc.) fall through to normal navigation.

export default function PosterCard({ item }: { item: TmdbItem }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [loaded, setLoaded] = useState(false);
  const { open } = useModal();

  if (!item.poster_path) return null;

  const title = item.title || item.name || '';
  const dateStr = item.release_date || item.first_air_date;
  const year = dateStr ? new Date(dateStr).getFullYear() : null;
  const rating = typeof item.vote_average === 'number' ? item.vote_average : 0;
  const type: MediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const href = buildHref(type, item);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle new-tab / open-in-window intents normally.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    launchFromPoster(ref.current, (typeDelay) => open(item, { typeDelay }));
  };

  // Magnetic pull: the card nudges a few px toward the cursor on hover.
  const handleMagnet = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width - 0.5) * 6;
    const dy = ((e.clientY - r.top) / r.height - 0.5) * 6;
    el.style.setProperty('--mx', `${dx.toFixed(1)}px`);
    el.style.setProperty('--my', `${dy.toFixed(1)}px`);
  };
  const resetMagnet = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--mx', '0px');
    el.style.setProperty('--my', '0px');
  };

  return (
    <a
      ref={ref}
      href={href}
      className={`poster-container ${loaded ? 'loaded' : 'loading'}`}
      onClick={handleClick}
      onMouseMove={handleMagnet}
      onMouseLeave={resetMagnet}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        loading="lazy"
        width={500}
        height={750}
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
          <Icon name="star" />
          {rating.toFixed(1)}
        </div>
      )}
      <div className="poster-overlay">
        <h3 className="poster-title">{title}</h3>
        <StarRating rating={rating * 10} />
        <div className="poster-year">{year ?? 'N/A'}</div>
        <div className="poster-description">{item.overview}</div>
      </div>
    </a>
  );
}
