'use client';

import { useEffect, useState } from 'react';
import { getWatchlist, clearWatchlist, WATCHLIST_EVENT, type WatchlistItem } from '@/lib/watchlist';
import Row from './Row';

// "My Watchlist" row, sourced from localStorage.
// Renders only when there are saved items.
// Automatically stays in sync with changes made anywhere on the page or across tabs.

export default function WatchlistRow() {
  const [items, setItems] = useState<WatchlistItem[] | null>(null);

  useEffect(() => {
    const sync = () => setItems(getWatchlist());
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div className="watchlist-row" id="my-watchlist-section">
      <div className="history-row">
        <button className="history-clear" onClick={() => clearWatchlist()}>
          Clear watchlist
        </button>
        <Row title={`My Watchlist (${items.length})`} items={items} />
      </div>
    </div>
  );
}
