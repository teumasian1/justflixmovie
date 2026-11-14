'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { TmdbItem, MediaType } from '@/lib/tmdb';
import { addToHistory } from '@/lib/history';

export interface OpenOptions {
  // Delay (ms) before the modal typewriter starts — raised by the launch
  // animation so typing begins only once the launch overlay has dissolved.
  typeDelay?: number;
  // True when the modal is opened over its own SSR detail route (via AutoOpen),
  // so closing should head to /home rather than reveal the bare detail page.
  fromRoute?: boolean;
  // Resume specific season & episode for TV
  season?: number;
  episode?: number;
}

interface ModalState {
  item: (TmdbItem & { media_type: MediaType }) | null;
  typeDelay: number;
  fromRoute: boolean;
  initialSeason?: number;
  initialEpisode?: number;
  open: (item: TmdbItem, opts?: OpenOptions) => void;
  close: () => void;
}

const ModalContext = createContext<ModalState | null>(null);

function resolveType(item: TmdbItem): MediaType {
  return item.media_type || (item.first_air_date ? 'tv' : 'movie');
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<ModalState['item']>(null);
  const [typeDelay, setTypeDelay] = useState(420);
  const [fromRoute, setFromRoute] = useState(false);
  const [initialSeason, setInitialSeason] = useState<number | undefined>(undefined);
  const [initialEpisode, setInitialEpisode] = useState<number | undefined>(undefined);

  const open = useCallback((next: TmdbItem, opts?: OpenOptions) => {
    setTypeDelay(opts?.typeDelay ?? 420);
    setFromRoute(opts?.fromRoute ?? false);
    setInitialSeason(opts?.season);
    setInitialEpisode(opts?.episode);
    const resolved = { ...next, media_type: resolveType(next) };
    setItem(resolved);
    addToHistory({
      ...resolved,
      last_season: opts?.season,
      last_episode: opts?.episode,
    });
  }, []);

  const close = useCallback(() => {
    setItem(null);
    setInitialSeason(undefined);
    setInitialEpisode(undefined);
  }, []);

  return (
    <ModalContext.Provider
      value={{
        item,
        typeDelay,
        fromRoute,
        initialSeason,
        initialEpisode,
        open,
        close,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalState {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within <ModalProvider>');
  return ctx;
}
