'use client';

import { useEffect, useState } from 'react';
import { getHistory, clearHistory, HISTORY_EVENT, type HistoryItem } from '@/lib/history';
import Row from './Row';

// "Recently Watched" row, sourced from localStorage. Renders nothing until it
// has read history on the client (avoids an SSR/CSR mismatch) and stays in sync
// via the custom history event and cross-tab `storage` events.

export default function WatchHistoryRow() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);

  useEffect(() => {
    const sync = () => setItems(getHistory());
    sync();
    window.addEventListener(HISTORY_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(HISTORY_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div className="history-row">
      <button className="history-clear" onClick={() => clearHistory()}>
        Clear history
      </button>
      <Row title="Recently Watched" items={items} />
    </div>
  );
}
