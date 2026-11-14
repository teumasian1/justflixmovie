'use client';

import { useEffect } from 'react';
import type { TmdbItem, MediaType } from '@/lib/tmdb';
import { useModal } from './ModalContext';

// On the SSR detail pages (/movie/[slug], /tv/[slug]) the server renders the
// SEO content; this client component then opens the player modal over it, the
// same way the original SPA booted into the modal from a deep link.

export default function AutoOpen({
  item,
  type,
  initialSeason,
  initialEpisode,
}: {
  item: TmdbItem;
  type: MediaType;
  initialSeason?: number;
  initialEpisode?: number;
}) {
  const { open } = useModal();
  useEffect(() => {
    open(
      { ...item, media_type: type },
      { fromRoute: true, season: initialSeason, episode: initialEpisode }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSeason, initialEpisode]);
  return null;
}
