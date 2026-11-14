import type { TmdbItem, MediaType } from './tmdb';

// Client-side "recently watched" history, persisted to localStorage. Records a
// title each time it's opened in the player, most-recent first, deduped by
// id+type and capped. A custom event lets the on-page row update live without a
// reload (the native `storage` event only fires in *other* tabs).

export type HistoryItem = TmdbItem & {
  media_type: MediaType;
  last_season?: number;
  last_episode?: number;
  watched_at?: number;
};

const KEY = 'jfm:history';
const MAX = 24;
export const HISTORY_EVENT = 'jfm:history-updated';

function read(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: HistoryItem[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(HISTORY_EVENT));
  } catch {
    /* quota / disabled storage — ignore */
  }
}

export function getHistory(): HistoryItem[] {
  return read();
}

export function getHistoryItem(id: number, mediaType: MediaType): HistoryItem | undefined {
  return read().find((h) => h.id === id && h.media_type === mediaType);
}

export function addToHistory(item: HistoryItem): void {
  if (typeof window === 'undefined' || !item?.id) return;
  // Keep only what the poster card needs, to stay well under the storage quota.
  const existing = read().find((h) => h.id === item.id && h.media_type === item.media_type);
  const entry: HistoryItem = {
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
    last_season: item.last_season ?? existing?.last_season,
    last_episode: item.last_episode ?? existing?.last_episode,
    watched_at: Date.now(),
  };
  const next = [entry, ...read().filter((h) => !(h.id === entry.id && h.media_type === entry.media_type))];
  write(next.slice(0, MAX));
}

export function updateHistoryProgress(
  id: number,
  media_type: MediaType,
  season: number,
  episode: number
): void {
  if (typeof window === 'undefined' || !id) return;
  const list = read();
  const index = list.findIndex((h) => h.id === id && h.media_type === media_type);
  if (index !== -1) {
    list[index].last_season = season;
    list[index].last_episode = episode;
    list[index].watched_at = Date.now();
    write(list);
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  write([]);
}
