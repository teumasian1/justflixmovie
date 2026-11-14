'use client';

import { useState, useEffect } from 'react';
import type { TmdbItem, MediaType } from '@/lib/tmdb';
import { useModal } from './ModalContext';
import { isInWatchlist, toggleWatchlist, WATCHLIST_EVENT } from '@/lib/watchlist';
import { openTrailer } from './TrailerModal';
import Icon from './Icon';

export default function DetailActions({
  item,
  type,
}: {
  item: TmdbItem;
  type: MediaType;
}) {
  const { open } = useModal();
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    if (!item?.id) return;
    const sync = () => setInWatchlist(isInWatchlist(item.id, type));
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [item?.id, type]);

  const handleWatch = () => {
    open({ ...item, media_type: type }, { fromRoute: true });
  };

  const handleToggleWatchlist = () => {
    toggleWatchlist({ ...item, media_type: type });
  };

  const trailer = item.videos?.results?.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  ) || item.videos?.results?.find((v) => v.site === 'YouTube');

  return (
    <div className="detail-seo-actions">
      <button type="button" className="detail-action-btn primary" onClick={handleWatch}>
        <Icon name="play" /> WATCH NOW
      </button>
      {trailer && (
        <button
          type="button"
          className="detail-action-btn tertiary"
          onClick={() => openTrailer(trailer.key, item.title || item.name || '')}
        >
          <Icon name="film" /> TRAILER
        </button>
      )}
      <button
        type="button"
        className={`detail-action-btn secondary ${inWatchlist ? 'active' : ''}`}
        onClick={handleToggleWatchlist}
      >
        <Icon name={inWatchlist ? 'bookmark' : 'bookmark-o'} />
        {inWatchlist ? 'IN WATCHLIST' : '+ WATCHLIST'}
      </button>
    </div>
  );
}
