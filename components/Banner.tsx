'use client';

import { useEffect, useState } from 'react';
import { BACKDROP_URL, type TmdbItem } from '@/lib/tmdb';
import { useModal } from './ModalContext';

// Hero banner with a 5s slideshow over the supplied items, ported from the
// banner logic in home.js. Items are picked server-side and passed in.

export default function Banner({ items }: { items: TmdbItem[] }) {
  const [index, setIndex] = useState(0);
  const [clock, setClock] = useState('--:--:--');
  const { open } = useModal();

  const slides = items.filter((i) => i.backdrop_path);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

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

  return (
    <div
      className="banner"
      id="banner"
      style={{ backgroundImage: `url(${BACKDROP_URL}${item.backdrop_path})` }}
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
          <button className="banner-button play" onClick={() => open(item)}>
            <i className="fas fa-play" /> Play
          </button>
          <button className="banner-button more-info" onClick={() => open(item)}>
            <i className="fas fa-info-circle" /> More Info
          </button>
        </div>
      </div>
      <div className="banner-telemetry" aria-hidden="true">
        LAT <b>{lat}</b> // LON <b>{lon}</b><br />
        FEED <b>{String(index + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}</b> // <b>{clock}</b>
      </div>
    </div>
  );
}
