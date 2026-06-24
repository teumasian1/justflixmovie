'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IMG_URL, type TmdbEpisode, type TmdbSeason } from '@/lib/tmdb';
import { SERVERS, PROBE_SERVERS, getServerUrl, nextServer } from '@/lib/servers';
import { buildHref, titleOf } from '@/lib/slug';
import { useModal } from './ModalContext';

// The streaming player modal. Ported from js/videoModal.js: server dropdown
// (incl. Server 5 / cinemaos.tech), per-server auto-probe, season tabs +
// dropdown, episode list with prev/next, typewriter title/synopsis, and the
// iframe with error-recovery server fallback.

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

  return (
    <div className={`modal show`} id="modal">
      <button className="close-button" onClick={dismiss} aria-label="Close">
        &times;
      </button>
      <div className={`modal-content ${isTV ? 'is-tv-modal' : 'is-movie-modal'}`}>
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
                    disabled={epIndex <= 0}
                    onClick={() => setEpisode(episodes[epIndex - 1].episode_number)}
                  >
                    <i className="fas fa-chevron-left" />
                  </button>
                  <span className="ep-nav-text">
                    EP <span>{episode}</span>
                  </span>
                  <button
                    className="ep-nav-btn"
                    title="Next Episode"
                    disabled={epIndex < 0 || epIndex >= episodes.length - 1}
                    onClick={() => setEpisode(episodes[epIndex + 1].episode_number)}
                  >
                    <i className="fas fa-chevron-right" />
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
                  <i className={`fas ${copied ? 'fa-check' : 'fa-link'}`} aria-hidden="true" />
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
                <div
                  key={ep.episode_number}
                  className={`episode-item ${ep.episode_number === episode ? 'active' : ''}`}
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
