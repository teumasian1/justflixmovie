'use client';

import { useRef } from 'react';
import type { TmdbItem } from '@/lib/tmdb';
import PosterCard from './PosterCard';

// Horizontal content row with scroll buttons + mouse-drag scrolling, mirroring
// initListNavigation() from the original home.js.

export default function Row({ title, items }: { title: string; items: TmdbItem[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const scrollByDir = (dir: -1 | 1) => {
    const el = listRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const el = listRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.pageX, scrollLeft: el.scrollLeft, moved: false };
    el.classList.add('dragging');
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const el = listRef.current;
    if (!el || !drag.current.active) return;
    const walk = e.pageX - drag.current.startX;
    if (Math.abs(walk) > 5) {
      drag.current.moved = true;
      e.preventDefault();
      el.scrollLeft = drag.current.scrollLeft - walk * 2;
    }
  };
  const stop = () => {
    const el = listRef.current;
    drag.current.active = false;
    el?.classList.remove('dragging');
  };
  // Swallow the click that ends a drag so it doesn't open a modal.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const withPosters = items.filter((i) => i.poster_path);

  return (
    <div className="row">
      <div className="row-header">
        <h2>{title}</h2>
      </div>
      <div className="list-wrapper">
        <button className="scroll-btn left" aria-label="Scroll left" onClick={() => scrollByDir(-1)}>
          <i className="fas fa-chevron-left" />
        </button>
        <div
          className="list"
          ref={listRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stop}
          onMouseLeave={stop}
          onClickCapture={onClickCapture}
        >
          {withPosters.map((item) => (
            <PosterCard key={`${item.id}-${item.media_type ?? ''}`} item={item} />
          ))}
        </div>
        <button className="scroll-btn right" aria-label="Scroll right" onClick={() => scrollByDir(1)}>
          <i className="fas fa-chevron-right" />
        </button>
      </div>
    </div>
  );
}
