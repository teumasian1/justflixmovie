'use client';

import { useState, useEffect } from 'react';
import Icon from './Icon';

export const TRAILER_EVENT = 'jfm:open-trailer';

export function openTrailer(videoKey: string, title: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TRAILER_EVENT, { detail: { videoKey, title } }));
  }
}

export default function TrailerModal() {
  const [active, setActive] = useState<{ videoKey: string; title: string } | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.videoKey) {
        setActive(detail);
      }
    };
    window.addEventListener(TRAILER_EVENT, onOpen);
    return () => window.removeEventListener(TRAILER_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="trailer-modal-backdrop" onClick={() => setActive(null)}>
      <div className="trailer-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="trailer-modal-header">
          <span className="trailer-title">🎬 {active.title} — Official Trailer</span>
          <button
            type="button"
            className="trailer-close-btn"
            onClick={() => setActive(null)}
            aria-label="Close trailer"
          >
            <Icon name="times" />
          </button>
        </div>
        <div className="trailer-video-box">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${active.videoKey}?autoplay=1&rel=0`}
            title={`${active.title} Trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
