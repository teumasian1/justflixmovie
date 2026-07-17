'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IMG_URL, type TmdbEpisode, type TmdbSeason } from '@/lib/tmdb';
import { SERVERS, PROBE_SERVERS, getServerUrl, nextServer } from '@/lib/servers';
import Icon from './Icon';
import { buildHref, titleOf } from '@/lib/slug';
import { useModal } from './ModalContext';

// The streaming player modal. Ported from js/videoModal.js: server dropdown
// (incl. Server 5 / cinemaos.tech), per-server auto-probe, season tabs +
// dropdown, episode list with prev/next, typewriter title/synopsis, and the
// iframe with error-recovery server fallback.
//
// Accessibility: rendered as a role="dialog" / aria-modal dialog. Focus moves
// into the dialog on open and is trapped within it; Escape closes; background
// scroll is locked while open; focus is restored to the opener on close.

interface SeasonData {
  seasons: TmdbSeason[];
}
interface SeasonEpisodes {
  episodes: TmdbEpisode[];
}

// Copy to clipboard with a fallback for browsers/contexts where the async
// Clipboard API is unavailable (e.g. non-secure origins).
function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  return new Promise((resolve) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch {
      /* ignore */
    }
    ta.remove();
    resolve();
  });
}

export default function PlayerModal() {
  const { item, typeDelay, fromRoute, close } = useModal();
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // The element that had focus before the modal opened — restored on close.
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const [server, setServer] = useState<string>('vidup.to');
  const [seasons, setSeasons] = useState<TmdbSeason[]>([]);
  const [season, setSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<TmdbEpisode[]>([]);
  const [episode, setEpisode] = useState<number>(1);
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Typewriter output.
  const [typedTitle, setTypedTitle] = useState('');
  const [typedDesc, setTypedDesc] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const type = item?.media_type ?? 'movie';

  // ---- Focus management + scroll lock (runs when an item opens/closes) ----
  useEffect(() => {
    if (!item) return;

    // Remember the currently focused element so we can return to it on close.
    lastFocusedRef.current = (document.activeElement as HTMLElement) || null;

    // Move focus into the dialog (the close button is the first control).
    // Defer a tick so the element is painted and focusable.
    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    // Lock background scroll while the modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      // Restore focus to whatever opened the modal.
      lastFocusedRef.current?.focus?.();
    };
  }, [item?.id]);

  // ---- Escape to close + focus trap ----
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismissRef.current?.();
      } else if (e.key === 'Tab') {
        // Trap focus within the dialog: wrap from last→first and first→last.
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select, input, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // ---- URL + history (shareable deep link, mirrors original showDetails) ----
  // Holds the id of the item we pushed a history entry for, so closing can pop
  // exactly that one entry (restoring the previous URL) rather than leaving the
  // deep link in the address bar.
  const pushedIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!item) return;
    const prevTitle = document.title;
    document.title = `${titleOf(item)} - JustFlixMovies`;

    // When opened in-app (poster/banner click), push a single history entry per
    // item so the deep link is shareable and Back/close can unwind it. React
    // Strict Mode (and remounts) run this effect twice in dev; guard against
    // stacking duplicates. When opened over its own detail route (AutoOpen),
    // the URL is already correct — don't push, so we never reveal a duplicate.
    if (!fromRoute && pushedIdRef.current !== item.id) {
      const href = buildHref(type, item);
      window.history.pushState({ type, id: item.id }, '', href);
      pushedIdRef.current = item.id;
    }

    const onPop = () => {
      // Our entry was popped by a navigation (Back button or history.back()).
      pushedIdRef.current = null;
      close();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      document.title = prevTitle;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // Close button: restore where the user came from. Opened over a detail route
  // → go to /home (revealing that bare SEO page would be confusing). Opened
  // in-app → pop our pushed entry so the URL returns to the previous page.
  const dismiss = useCallback(() => {
    if (fromRoute) {
      close();
      router.push('/home');
    } else if (pushedIdRef.current !== null) {
      window.history.back();
    } else {
      close();
    }
  }, [fromRoute, router, close]);
  // Keep a ref so the keydown handler (which doesn't depend on dismiss) can call
  // the latest version without re-binding.
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  // ---- Swipe-to-dismiss (touch) ----
  // On touch devices, dragging down on the grab handle / server bar (the top of
  // the sheet) slides the modal down; releasing past a threshold dismisses it.
  // Dragging is only initiated from .modal-grab / .server-selector so the
  // scrollable episode list and the video itself stay usable.
  const contentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startY: 0, currentY: 0 });
  useEffect(() => {
    if (!item) return;
    const content = contentRef.current;
    const root = dialogRef.current;
    if (!content || !root) return;

    const DISMISS_THRESHOLD = 120; // px dragged before a release dismisses

    const startFrom = (el: EventTarget | null): boolean =>
      !!(el && (el as HTMLElement).closest?.('.modal-grab, .server-selector'));

    const onStart = (e: TouchEvent) => {
      // Only react to a single-finger drag started on the grab area.
      if (e.touches.length !== 1 || !startFrom(e.target)) return;
      dragRef.current = { active: true, startY: e.touches[0].clientY, currentY: e.touches[0].clientY };
      root.classList.add('swiping');
      root.classList.remove('swipe-ready');
    };
    const onMove = (e: TouchEvent) => {
      if (!dragRef.current.active) return;
      const y = e.touches[0].clientY;
      dragRef.current.currentY = y;
      // Only drag downward (resist upward so it doesn't feel like it pulls up).
      const dy = Math.max(0, y - dragRef.current.startY);
      content.style.transform = `translateY(${dy}px)`;
      // Fade the backdrop with the drag.
      root.style.opacity = String(Math.max(0.35, 1 - dy / 600));
    };
    const onEnd = () => {
      if (!dragRef.current.active) return;
      const dy = Math.max(0, dragRef.current.currentY - dragRef.current.startY);
      dragRef.current.active = false;
      root.classList.remove('swiping');
      root.classList.add('swipe-ready');
      if (dy > DISMISS_THRESHOLD) {
        dismissRef.current?.();
      } else {
        // Snap back (animated via the .swipe-ready transition).
        content.style.transform = '';
        root.style.opacity = '';
      }
    };

    root.addEventListener('touchstart', onStart, { passive: true });
    root.addEventListener('touchmove', onMove, { passive: true });
    root.addEventListener('touchend', onEnd);
    root.addEventListener('touchcancel', onEnd);
    return () => {
      root.removeEventListener('touchstart', onStart);
      root.removeEventListener('touchmove', onMove);
      root.removeEventListener('touchend', onEnd);
      root.removeEventListener('touchcancel', onEnd);
      root.classList.remove('swiping', 'swipe-ready');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // Copy the title's shareable deep link, showing a brief "Copied!" confirmation.
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyLink = useCallback(() => {
    if (!item) return;
    const url = `${window.location.origin}${buildHref(type, item)}`;
    copyToClipboard(url).finally(() => {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1600);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  // ---- Typewriter ----
  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => {
    if (!item) return;
    clearTimers();
    setTypedTitle('');
    setTypedDesc('');
    const title = titleOf(item);
    const desc = item.overview || '';
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setTypedTitle(title);
      setTypedDesc(desc);
      return;
    }

    const titleSpeed = 40;
    const type1 = (i: number) => {
      setTypedTitle(title.slice(0, i));
      if (i < title.length) timers.current.push(setTimeout(() => type1(i + 1), titleSpeed));
    };
    const descStart = typeDelay + title.length * titleSpeed + 220;
    const type2 = (i: number) => {
      setTypedDesc(desc.slice(0, i));
      if (i < desc.length) timers.current.push(setTimeout(() => type2(i + 1), 10));
    };
    timers.current.push(setTimeout(() => type1(1), typeDelay));
    timers.current.push(setTimeout(() => type2(1), descStart));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // ---- Probe servers on open, pick first working (else fallback) ----
  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    setServer('vidup.to');

    (async () => {
      const probe = async (id: string) => {
        const url = getServerUrl(id, type, item.id);
        if (!url) return null;
        try {
          const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
          if (res.ok || res.type === 'opaque') return id;
        } catch {
          /* ignore */
        }
        return null;
      };
      const winners = await Promise.all(PROBE_SERVERS.map(probe));
      const first = winners.find(Boolean);
      if (!cancelled && first) setServer(first);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // ---- Load seasons + episodes for TV ----
  useEffect(() => {
    if (!item || type !== 'tv') {
      setSeasons([]);
      setEpisodes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tmdb/tv/${item.id}`);
        const data: SeasonData = await res.json();
        const valid = (data.seasons || [])
          .filter((s) => s.season_number > 0)
          .sort((a, b) => a.season_number - b.season_number);
        if (cancelled) return;
        setSeasons(valid);
        if (valid.length) setSeason(valid[0].season_number);
      } catch {
        if (!cancelled) setSeasons([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // Fetch episodes whenever the selected season changes.
  useEffect(() => {
    if (!item || type !== 'tv' || !season) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tmdb/tv/${item.id}/season/${season}`);
        const data: SeasonEpisodes = await res.json();
        if (cancelled) return;
        const eps = data.episodes || [];
        setEpisodes(eps);
        setEpisode(eps.length ? eps[0].episode_number : 1);
      } catch {
        if (!cancelled) setEpisodes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, season]);

  // ---- Recompute iframe URL ----
  useEffect(() => {
    if (!item) return;
    const url = getServerUrl(server, type, item.id, season, episode);
    if (url) setIframeUrl(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, server, season, episode]);

  if (!item) return null;

  const isTV = type === 'tv';
  const epIndex = episodes.findIndex((e) => e.episode_number === episode);

  const onIframeError = () => {
    const fallback = nextServer(server);
    if (fallback !== server) setServer(fallback);
  };

  // Clicking the backdrop closes the modal (but not when interacting with its
  // contents — onClick on .modal only fires for the backdrop itself).
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) dismiss();
  };

  return (
    <div
      className="modal show"
      id="modal"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Watch ${titleOf(item)}`}
      onClick={onBackdropClick}
    >
      <button className="close-button" ref={closeButtonRef} onClick={dismiss} aria-label="Close">
        &times;
      </button>
      <div className="modal-grab" aria-hidden="true" />
      <div className={`modal-content ${isTV ? 'is-tv-modal' : 'is-movie-modal'}`} ref={contentRef}>
        <div className="modal-main">
          <div className="video-section">
            <div className="server-selector">
              <div className="server-buttons" id="server-buttons">
                <select
                  className="server-dropdown"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  aria-label="Select server"
                >
                  {SERVERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {isTV && seasons.length > 0 && (
                <div className="season-picker" style={{ display: 'flex' }}>
                  <select
                    className="season-dropdown"
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value))}
                    aria-label="Select season"
                  >
                    {seasons.map((s) => (
                      <option key={s.season_number} value={s.season_number}>
                        Season {s.season_number}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isTV && episodes.length > 0 && (
                <div className="episode-nav" style={{ display: 'flex' }}>
                  <button
                    className="ep-nav-btn"
                    title="Previous Episode"
                    aria-label="Previous Episode"
                    disabled={epIndex <= 0}
                    onClick={() => setEpisode(episodes[epIndex - 1].episode_number)}
                  >
                    <Icon name="chevron-left" />
                  </button>
                  <span className="ep-nav-text" aria-live="polite">
                    EP <span>{episode}</span>
                  </span>
                  <button
                    className="ep-nav-btn"
                    title="Next Episode"
                    aria-label="Next Episode"
                    disabled={epIndex < 0 || epIndex >= episodes.length - 1}
                    onClick={() => setEpisode(episodes[epIndex + 1].episode_number)}
                  >
                    <Icon name="chevron-right" />
                  </button>
                </div>
              )}
            </div>

            <div className="video-wrapper">
              <div className="video-container">
                <iframe
                  id="modal-video"
                  key={iframeUrl}
                  src={iframeUrl}
                  frameBorder="0"
                  allowFullScreen
                  allow="fullscreen *; encrypted-media *; picture-in-picture *; autoplay *"
                  onError={onIframeError}
                />
              </div>
            </div>
          </div>

          <div className="modal-body">
            <div className="modal-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.poster_path ? `${IMG_URL}${item.poster_path}` : '/placeholder.jpg'}
                alt={titleOf(item)}
              />
            </div>
            <div className="modal-text">
              <div className="modal-title-row">
                <h2 className="tw-done">{typedTitle}</h2>
                <button
                  type="button"
                  className={`copy-link-btn ${copied ? 'copied' : ''}`}
                  onClick={copyLink}
                  aria-label="Copy link to this title"
                  title="Copy link"
                >
                  <Icon name={copied ? 'check' : 'link'} />
                  <span>{copied ? 'Copied!' : 'Copy link'}</span>
                </button>
              </div>
              <div className="modal-meta">
                <div className="stars">
                  {'★'.repeat(Math.round((item.vote_average || 0) / 2))}
                </div>
                <span className="release-date">
                  {new Date(item.release_date || item.first_air_date || '').getFullYear() || ''}
                </span>
              </div>
              <p className="tw-done">{typedDesc}</p>
            </div>
          </div>
        </div>

        {isTV && (
          <div className="episodes-section" style={{ display: 'flex' }}>
            <div className="seasons-bar">
              <h3>Seasons</h3>
              <div className="season-tabs" id="season-tabs">
                {seasons.map((s) => (
                  <button
                    key={s.season_number}
                    className={`season-tab ${s.season_number === season ? 'active' : ''}`}
                    onClick={() => setSeason(s.season_number)}
                  >
                    Season {s.season_number}
                  </button>
                ))}
              </div>
            </div>
            <div className="episodes-list" id="episodes-list">
              {episodes.length === 0 && (
                <div className="no-episodes">No episodes available for this season.</div>
              )}
              {episodes.map((ep) => (
                <button
                  key={ep.episode_number}
                  type="button"
                  className={`episode-item ${ep.episode_number === episode ? 'active' : ''}`}
                  aria-pressed={ep.episode_number === episode}
                  onClick={() => setEpisode(ep.episode_number)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="episode-thumbnail"
                    src={ep.still_path ? `${IMG_URL}${ep.still_path}` : '/placeholder.jpg'}
                    alt={`Episode ${ep.episode_number}`}
                    onError={(e) => ((e.target as HTMLImageElement).src = '/placeholder.jpg')}
                  />
                  <div className="episode-info">
                    <div className="episode-number">Episode {ep.episode_number}</div>
                    <div className="episode-title">{ep.name || `Episode ${ep.episode_number}`}</div>
                    <div className="episode-description">
                      {ep.overview || 'No description available.'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
