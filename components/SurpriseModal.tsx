'use client';

import { useState, useEffect } from 'react';
import { useModal } from './ModalContext';
import Icon from './Icon';
import { IMG_URL, BACKDROP_URL, type TmdbItem, type MediaType } from '@/lib/tmdb';
import { addToWatchlist, isInWatchlist, WATCHLIST_EVENT } from '@/lib/watchlist';

export const SURPRISE_EVENT = 'jfm:open-surprise-modal';

export function openSurpriseModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SURPRISE_EVENT));
  }
}

interface VibeOption {
  id: string;
  label: string;
  type: MediaType;
  genre?: string;
  keywords?: string;
  minRating?: number;
}

const VIBES: VibeOption[] = [
  { id: 'any', label: '🎲 Any Vibe', type: 'movie' },
  { id: 'halloween', label: '🎃 Halloween Spooktacular', type: 'movie', keywords: '3335' },
  { id: 'top-rated', label: '⭐ Masterpiece (8+)', type: 'movie', minRating: 8 },
  { id: 'scifi', label: '🧠 Sci-Fi & Mind-Benders', type: 'movie', genre: '878' },
  { id: 'action', label: '🍿 Action Blockbuster', type: 'movie', genre: '28' },
  { id: 'horror', label: '👻 Late Night Horror', type: 'movie', genre: '27' },
  { id: 'comedy', label: '😂 Comfort Comedy', type: 'movie', genre: '35' },
  { id: 'anime', label: '🇯🇵 Anime TV', type: 'tv', genre: '16' },
  { id: 'tv', label: '📺 Binge TV Series', type: 'tv' },
];

export default function SurpriseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeVibe, setActiveVibe] = useState<string>('any');
  const [rolling, setRolling] = useState(false);
  const [picked, setPicked] = useState<TmdbItem | null>(null);
  const [saved, setSaved] = useState(false);
  const { open } = useModal();

  useEffect(() => {
    const onOpen = () => {
      setIsOpen(true);
      if (!picked) {
        rollRandom();
      }
    };
    window.addEventListener(SURPRISE_EVENT, onOpen);
    return () => window.removeEventListener(SURPRISE_EVENT, onOpen);
  }, [picked, activeVibe]);

  useEffect(() => {
    if (!picked) {
      setSaved(false);
      return;
    }
    const mediaType: MediaType = picked.media_type || (picked.first_air_date ? 'tv' : 'movie');
    const sync = () => setSaved(isInWatchlist(picked.id, mediaType));
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    return () => window.removeEventListener(WATCHLIST_EVENT, sync);
  }, [picked]);

  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const rollRandom = async (overrideVibeId?: string) => {
    const vibeId = overrideVibeId || activeVibe;
    const vibe = VIBES.find((v) => v.id === vibeId) || VIBES[0];
    setRolling(true);

    try {
      const type = vibe.type;
      const randomPage = Math.floor(Math.random() * 5) + 1; // pick from top 5 pages
      const params = new URLSearchParams();
      params.set('sort_by', 'popularity.desc');
      params.set('page', String(randomPage));
      params.set('vote_count.gte', '250');
      if (vibe.minRating) params.set('vote_average.gte', String(vibe.minRating));
      if (vibe.genre) params.set('with_genres', vibe.genre);
      if (vibe.keywords) {
        params.set('with_keywords', vibe.keywords);
        params.set('vote_count.gte', '80');
      }

      const today = new Date().toISOString().slice(0, 10);
      if (type === 'movie') {
        params.set('release_date.lte', today);
        params.set('with_release_type', '4|5|6');
      } else {
        params.set('first_air_date.lte', today);
      }

      const res = await fetch(`/api/tmdb/discover/${type}?${params.toString()}`);
      const data = await res.json();
      const results: TmdbItem[] = (data.results || []).filter((i: TmdbItem) => i.poster_path);

      if (results.length > 0) {
        // Dramatic delay for slot-machine feel
        await new Promise((r) => setTimeout(r, 450));
        const randomIndex = Math.floor(Math.random() * results.length);
        const item = { ...results[randomIndex], media_type: type };
        setPicked(item);
      }
    } catch {
      // fallback
    } finally {
      setRolling(false);
    }
  };

  const handleSelectVibe = (vibeId: string) => {
    setActiveVibe(vibeId);
    rollRandom(vibeId);
  };

  const handleWatch = () => {
    if (!picked) return;
    const mediaType: MediaType = picked.media_type || (picked.first_air_date ? 'tv' : 'movie');
    setIsOpen(false);
    open({ ...picked, media_type: mediaType });
  };

  const handleToggleWatchlist = () => {
    if (!picked) return;
    const mediaType: MediaType = picked.media_type || (picked.first_air_date ? 'tv' : 'movie');
    addToWatchlist({ ...picked, media_type: mediaType });
  };

  if (!isOpen) return null;

  const title = picked?.title || picked?.name || 'Rolling…';
  const year = picked ? new Date(picked.release_date || picked.first_air_date || '').getFullYear() : null;
  const rating = picked?.vote_average ? picked.vote_average.toFixed(1) : null;

  return (
    <div className="surprise-modal-backdrop" onClick={() => setIsOpen(false)}>
      <div className="surprise-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="surprise-header">
          <div className="surprise-kicker">
            <Icon name="dice" /> CAN&apos;T DECIDE? LET FATE PICK
          </div>
          <button
            type="button"
            className="surprise-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            <Icon name="times" />
          </button>
        </div>

        {/* Vibe Chips Selector */}
        <div className="surprise-vibes-list">
          {VIBES.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`surprise-vibe-chip ${activeVibe === v.id ? 'active' : ''}`}
              onClick={() => handleSelectVibe(v.id)}
              disabled={rolling}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Selected Title Presentation */}
        <div className={`surprise-result-box ${rolling ? 'is-rolling' : ''}`}>
          {picked?.backdrop_path && (
            <div
              className="surprise-bg-backdrop"
              style={{ backgroundImage: `url(${BACKDROP_URL}${picked.backdrop_path})` }}
            />
          )}
          <div className="surprise-result-inner">
            <div className="surprise-poster-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={picked?.poster_path ? `${IMG_URL}${picked.poster_path}` : '/placeholder.jpg'}
                alt={title}
                className="surprise-poster-img"
              />
            </div>
            <div className="surprise-details">
              <div className="surprise-meta-line">
                {rating && <span className="surprise-rating">⭐ {rating}</span>}
                {year && <span className="surprise-year">{year}</span>}
                <span className="surprise-tag">
                  {picked?.media_type === 'tv' ? 'TV SERIES' : 'MOVIE'}
                </span>
              </div>
              <h3 className="surprise-title">{title}</h3>
              <p className="surprise-overview">
                {picked?.overview
                  ? picked.overview.slice(0, 220) + (picked.overview.length > 220 ? '…' : '')
                  : 'Get ready for an incredible watch.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="surprise-actions">
          <button
            type="button"
            className="surprise-btn-primary"
            onClick={handleWatch}
            disabled={rolling || !picked}
          >
            <Icon name="play" /> WATCH NOW
          </button>
          <button
            type="button"
            className={`surprise-btn-secondary ${saved ? 'active' : ''}`}
            onClick={handleToggleWatchlist}
            disabled={rolling || !picked}
          >
            <Icon name={saved ? 'bookmark' : 'bookmark-o'} /> {saved ? 'IN WATCHLIST' : '+ WATCHLIST'}
          </button>
          <button
            type="button"
            className="surprise-btn-tertiary"
            onClick={() => rollRandom()}
            disabled={rolling}
          >
            <Icon name="dice" /> {rolling ? 'ROLLING…' : 'REROLL'}
          </button>
        </div>
      </div>
    </div>
  );
}
