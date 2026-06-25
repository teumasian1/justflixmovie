'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { BACKDROP_URL, type TmdbItem } from '@/lib/tmdb';
import { buildHref } from '@/lib/slug';
import { useModal } from './ModalContext';

// Hero banner with a 5s slideshow over the supplied items, ported from the
// banner logic in home.js. Items are picked server-side and passed in.
//
// Controls: clickable dot indicators + prev/next arrows let the user jump
// slides directly, and hovering the banner pauses the auto-advance (resumes on
// leave). The two CTA buttons are distinct: Play opens the player in-app
// instantly; More Info links to the shareable detail route.

const SLIDE_MS = 5000;

export default function Banner({ items }: { items: TmdbItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [clock, setClock] = useState('--:--:--');
  const { open } = useModal();

  const slides = items.filter((i) => i.backdrop_path);

  const go = useCallback(
    (dir: -1 | 1) => setIndex((i) => (i + dir + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [slides.length, paused]);

  // Live HUD clock for the hero telemetry readout.
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (slides.length === 0) return <div className="banner" id="banner" />;

  const item = slides[index];
  const title = item.title || item.name || '';
  const dateStr = item.release_date || item.first_air_date;
  const year = dateStr ? new Date(dateStr).getFullYear() : null;
  const isTV = item.media_type === 'tv' || (!item.title && !!item.name) || !!item.first_air_date;
  // Deterministic pseudo-coordinates derived from the item id (fake telemetry).
  const lat = (((item.id % 18000) / 100) - 90).toFixed(2);
  const lon = (((item.id % 36000) / 100) - 180).toFixed(2);
  const mediaType: 'movie' | 'tv' = isTV ? 'tv' : 'movie';
  const detailHref = buildHref(mediaType, item);

  return (
    <div
      className="banner"
      id="banner"
      style={{ backgroundImage: `url(${BACKDROP_URL}${item.backdrop_path})` }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="banner-scan" aria-hidden="true" />
      <div className="banner-content">
        <span className="banner-kicker"><span className="kicker-type">Featured</span></span>
        <h1 id="banner-title">{title}</h1>
        <p id="banner-overview">{item.overview}</p>
        <div className="banner-meta" id="banner-meta">
          {typeof item.vote_average === 'number' && item.vote_average > 0 && (
            <span className="banner-chip rating">
              <i className="fas fa-star" />
              {item.vote_average.toFixed(1)}
            </span>
          )}
          {year && <span className="banner-chip">{year}</span>}
          <span className="banner-chip">{isTV ? 'TV Series' : 'Movie'}</span>
          <span className="banner-chip hd">HD</span>
        </div>
        <div className="banner-buttons">
          {/* Play opens the player modal in-app instantly. */}
          <button className="banner-button play" onClick={() => open(item)}>
            <i className="fas fa-play" /> Play
          </button>
          {/* More Info opens the shareable detail route (own URL + SEO page). */}
          <Link href={detailHref} className="banner-button more-info">
            <i className="fas fa-info-circle" /> More Info
          </Link>
        </div>
      </div>
      <div className="banner-telemetry" aria-hidden="true">
        LAT <b>{lat}</b> // LON <b>{lon}</b><br />
        FEED <b>{String(index + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}</b> // <b>{clock}</b>
      </div>

      {/* Slideshow controls — only when there is more than one slide. */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="banner-arrow banner-arrow-prev"
            aria-label="Previous featured title"
            onClick={() => go(-1)}
          >
            <i className="fas fa-chevron-left" />
          </button>
          <button
            type="button"
            className="banner-arrow banner-arrow-next"
            aria-label="Next featured title"
            onClick={() => go(1)}
          >
            <i className="fas fa-chevron-right" />
          </button>
          <div className="banner-dots" role="tablist" aria-label="Featured titles">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show featured title ${i + 1}`}
                className={`banner-dot ${i === index ? 'is-active' : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
