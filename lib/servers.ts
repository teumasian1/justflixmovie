// Streaming server registry + embed-URL builder.
// Ported from the original js/videoModal.js. Server 5 (cinemaos.tech) was the
// most recent addition — embed format is /player/{id}[/{season}/{episode}].

export type MediaType = 'movie' | 'tv';

export interface ServerDef {
  name: string;
  id: string;
  url: string;
}

export const SERVERS: ServerDef[] = [
  { name: 'Server 1', id: 'vidup.to', url: 'https://vidup.to' },
  { name: 'Server 2', id: 'vidsrc.me', url: 'https://vidsrc.me/embed' },
  { name: 'Server 3', id: 'player.videasy.net', url: 'https://player.videasy.net' },
  { name: 'Server 4', id: 'embed.filmu.in', url: 'https://embed.filmu.in' },
  { name: 'Server 5', id: 'cinemaos.tech', url: 'https://cinemaos.tech' },
];

// Servers probed (HEAD) on open to auto-pick a working default, mirroring the
// original behaviour.
export const PROBE_SERVERS = ['vidup.to', 'vidsrc.me', 'player.videasy.net'];

export function getServerUrl(
  server: string,
  type: MediaType,
  id: string | number,
  season: string | number = '1',
  episode: string | number = '1'
): string | null {
  if (!id || !type || !server) return null;
  const s = season;
  const e = episode;

  switch (server) {
    case 'vidup.to':
      return type === 'movie'
        ? `https://vidup.to/movie/${id}`
        : `https://vidup.to/tv/${id}/${s}/${e}`;

    case 'vidsrc.me':
      return type === 'movie'
        ? `https://vidsrc.me/embed/movie/${id}`
        : `https://vidsrc.me/embed/tv/${id}?s=${s}&e=${e}`;

    case 'player.videasy.net':
      return type === 'movie'
        ? `https://player.videasy.net/movie/${id}`
        : `https://player.videasy.net/tv/${id}/${s}/${e}`;

    case 'embed.filmu.in':
      return type === 'movie'
        ? `https://embed.filmu.in/movie/${id}`
        : `https://embed.filmu.in/tv/${id}/${s}/${e}`;

    case 'cinemaos.tech':
      return type === 'movie'
        ? `https://cinemaos.tech/player/${id}`
        : `https://cinemaos.tech/player/${id}/${s}/${e}`;

    default:
      return null;
  }
}

// Next server in rotation for error-recovery fallback.
export function nextServer(current: string): string {
  const ids = SERVERS.map((x) => x.id);
  const i = ids.indexOf(current);
  if (i === -1 || i === ids.length - 1) return ids[0];
  return ids[i + 1];
}
