import { NextRequest, NextResponse } from 'next/server';
import { filterBanned } from '@/lib/banned';

// Server-side TMDB proxy. The browser calls /api/tmdb/<tmdb-path>?<query> and
// this handler injects the secret API key, so it never reaches the client.
// Used by the player modal (season/episode lists) and navbar search.

const BASE_URL = 'https://api.themoviedb.org/3';

// Allowlist of read-only TMDB v3 endpoints used by the client. Prevents this
// proxy from being abused to hit arbitrary or state-changing TMDB endpoints.
const ALLOWED_PATH_RE =
  /^(discover\/(movie|tv)|search\/(multi|movie|tv)|movie\/\d+|tv\/\d+(\/season\/\d+)?)$/;

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB key not configured' }, { status: 500 });
  }

  const segments = params.path || [];
  if (segments.some((s) => !s || s === '.' || s === '..' || !/^[a-zA-Z0-9_-]+$/.test(s))) {
    return NextResponse.json({ error: 'Invalid TMDB path' }, { status: 400 });
  }

  const path = segments.join('/');
  if (!ALLOWED_PATH_RE.test(path)) {
    return NextResponse.json({ error: 'Endpoint not allowed' }, { status: 403 });
  }

  const url = new URL(`${BASE_URL}/${path}`);

  // Forward incoming query params, then force our key.
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key !== 'api_key') url.searchParams.set(key, value);
  });
  url.searchParams.set('api_key', apiKey);

  try {
    const upstream = await fetch(url.toString(), {
      next: { revalidate: 60 * 60 }, // cache list/search responses for an hour
    });

    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Unexpected upstream response' },
        { status: upstream.ok ? 502 : upstream.status }
      );
    }

    const data = await upstream.json();

    // Strip banned titles from list/search responses so the navbar live-search
    // and any client-side discover refetches can never surface them.
    if (data && Array.isArray(data.results)) {
      data.results = filterBanned(data.results);
    }

    return NextResponse.json(data, {
      status: upstream.status,
      headers: { 'cache-control': 'public, max-age=0, s-maxage=3600', 'x-robots-tag': 'noindex' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to reach TMDB' }, { status: 502 });
  }
}
