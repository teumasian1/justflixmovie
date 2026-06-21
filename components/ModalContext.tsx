'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { TmdbItem, MediaType } from '@/lib/tmdb';

export interface OpenOptions {
  // Delay (ms) before the modal typewriter starts — raised by the launch
  // animation so typing begins only once the launch overlay has dissolved.
  typeDelay?: number;
}

interface ModalState {
  item: (TmdbItem & { media_type: MediaType }) | null;
  typeDelay: number;
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

  const open = useCallback((next: TmdbItem, opts?: OpenOptions) => {
    setTypeDelay(opts?.typeDelay ?? 420);
    setItem({ ...next, media_type: resolveType(next) });
  }, []);

  const close = useCallback(() => {
    setItem(null);
  }, []);

  return (
    <ModalContext.Provider value={{ item, typeDelay, open, close }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalState {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within <ModalProvider>');
  return ctx;
}
