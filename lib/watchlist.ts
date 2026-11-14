import type { TmdbItem, MediaType } from './tmdb';

// Client-side Watchlist / Save for Later, persisted to localStorage.
// Mirrors lib/history.ts: dispatches a custom event so other components
// on the page update live without a reload, while the storage event
// keeps cross-tab state in sync.

export type WatchlistItem = TmdbItem & { media_type: MediaType; added_at?: number };

const KEY = 'jfm:watchlist';
const MAX = 60;
export const WATCHLIST_EVENT = 'jfm:watchlist-updated';

function read(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: WatchlistItem[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(WATCHLIST_EVENT));
  } catch {
    /* quota / disabled storage — ignore */
  }
}

export function getWatchlist(): WatchlistItem[] {
  return read();
}

export function isInWatchlist(id: number, mediaType?: MediaType): boolean {
  if (typeof window === 'undefined' || !id) return false;
  const list = read();
  return list.some((item) => item.id === id && (!mediaType || item.media_type === mediaType));
}

export function addToWatchlist(item: WatchlistItem): void {
  if (typeof window === 'undefined' || !item?.id) return;
  const entry: WatchlistItem = {
    id: item.id,
    media_type: item.media_type,
    title: item.title,
    name: item.name,
    overview: item.overview,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    vote_average: item.vote_average,
    added_at: Date.now(),
  };
  const list = read().filter((h) => !(h.id === entry.id && h.media_type === entry.media_type));
  write([entry, ...list].slice(0, MAX));
}

export function removeFromWatchlist(id: number, mediaType?: MediaType): void {
  if (typeof window === 'undefined' || !id) return;
  const next = read().filter((h) => !(h.id === id && (!mediaType || h.media_type === mediaType)));
  write(next);
}

export function toggleWatchlist(item: WatchlistItem): boolean {
  if (isInWatchlist(item.id, item.media_type)) {
    removeFromWatchlist(item.id, item.media_type);
    return false;
  } else {
    addToWatchlist(item);
    return true;
  }
}

export function clearWatchlist(): void {
  if (typeof window === 'undefined') return;
  write([]);
}
