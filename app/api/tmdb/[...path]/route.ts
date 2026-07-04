import { NextRequest, NextResponse } from 'next/server';
import { filterBanned } from '@/lib/banned';

// Server-side TMDB proxy. The browser calls /api/tmdb/<tmdb-path>?<query> and
// this handler injects the secret API key, so it never reaches the client.
// Used by the player modal (season/episode lists) and navbar search.

export const runtime = 'edge'; // runs as a Cloudflare Worker on Pages

const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB key not configured' }, { status: 500 });
  }

  const path = (params.path || []).join('/');
  const url = new URL(`${BASE_URL}/${path}`);

  // Forward incoming query params, then force our key.
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key !== 'api_key') url.searchParams.set(key, value);
  });
  url.searchParams.set('api_key', apiKey);

  const upstream = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 }, // cache list/search responses for an hour
  });
  const data = await upstream.json();

  // Strip banned titles from list/search responses so the navbar live-search
  // and any client-side discover refetches can never surface them.
  if (data && Array.isArray(data.results)) {
    data.results = filterBanned(data.results);
  }

  return NextResponse.json(data, {
    status: upstream.status,
    headers: { 'cache-control': 'public, max-age=0, s-maxage=3600' },
  });
}
