# JustFlixMovies — Next.js (SSR) port

A server-rendered rebuild of the JustFlixMovies static site on **Next.js 14 (App
Router) + TypeScript**, designed to deploy as a single project to **Cloudflare
Pages**. Movie/TV detail pages are server-rendered with per-title metadata and
JSON-LD so Google indexes real content on the first crawl (the original SPA only
rendered content after client-side JS ran).

See `../.kilo/plans/ssr-overhaul-plan.md` for the full rationale (why SSR, why
Next, the single-deploy / free-tier model, and the SEO breakdown).

## What carried over from the static site

| Feature | Where it lives now |
|---|---|
| Trending Movies / TV / Anime / K-Drama rows | `app/page.tsx` (SSR) + `components/Row.tsx` |
| Hero banner slideshow | `components/Banner.tsx` |
| Player modal (iframe, server dropdown, seasons/episodes, prev/next, typewriter) | `components/PlayerModal.tsx` |
| **5 streaming servers incl. Server 5 / cinemaos.tech** | `lib/servers.ts` |
| Auto-probe first working server on open | `components/PlayerModal.tsx` |
| Poster → modal "launch" FLIP animation | `components/launch.ts` |
| Live multi-search | `components/Navbar.tsx` → `/api/tmdb` |
| Browse with genre/year/country/sort filters + pagination | `app/browse/page.tsx` + `components/Browse.tsx` |
| SEO detail pages (`/movie/slug-id`, `/tv/slug-id`) | `app/movie/[slug]`, `app/tv/[slug]` |
| sitemap.xml / robots.txt | `app/sitemap.ts`, `app/robots.ts` (generated) |
| Neon Marquee styling | `app/globals.css` (copied verbatim from `css/redesign.css`) |

## Architecture

```
app/
  layout.tsx              global <head>, fonts, theme, Navbar + PlayerModal shell
  page.tsx                home — SSR rows + banner (ISR, 1h)
  browse/page.tsx         filterable browse view
  movie/[slug]/page.tsx   SSR movie detail + generateMetadata + JSON-LD (ISR, 24h)
  tv/[slug]/page.tsx      SSR tv detail + generateMetadata + JSON-LD (ISR, 24h)
  api/tmdb/[...path]/      server proxy that injects the TMDB key for client calls
  sitemap.ts / robots.ts  generated SEO files
lib/
  tmdb.ts                 server-side TMDB client (key from env)
  servers.ts              streaming server registry + embed URL builder
  slug.ts                 name-id slug helpers
  detail.ts               per-title metadata + JSON-LD builders
components/
  ModalContext.tsx        open/close player modal from anywhere
  Navbar, Banner, Row, PosterCard, Browse, PlayerModal, DetailView, AutoOpen, ...
```

**Frontend and backend are one app, one deploy.** Server components + the
`/api/tmdb` route compile to Cloudflare Workers; static assets go to the CDN.
There is no separate backend service.

## Local development

```bash
cd nextjs-moviesite
npm install
npm run dev          # http://localhost:3000
```

`.env.local` is pre-filled with the old public TMDB key so it runs immediately.
**Rotate that key before production** — it is already public in git history.

### Environment variables

| Var | Purpose |
|---|---|
| `TMDB_API_KEY` | TMDB key, read server-side only. Never shipped to the browser. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, OG tags, and the sitemap. |

## Deploy to Cloudflare Pages (free tier)

One project, one build. Two options:

**A. Git integration (recommended)**
1. Push this folder to a repo and create a Cloudflare Pages project from it.
2. Build command: `npx @cloudflare/next-on-pages` · Output dir: `.vercel/output/static`.
3. Set the **Compatibility flag** `nodejs_compat`.
4. Add env vars `TMDB_API_KEY` and `NEXT_PUBLIC_SITE_URL` in the project settings.

**B. CLI**
```bash
npm run pages:build         # npx @cloudflare/next-on-pages
npm run pages:deploy        # wrangler pages deploy .vercel/output/static
```

For local Workers-runtime testing, put the same vars in a `.dev.vars` file and
run `npx @cloudflare/next-on-pages && npx wrangler pages dev .vercel/output/static`.

> ⚠️ Do **not** switch to `output: 'export'` (static export) — that drops SSR/ISR
> and returns the site to the original SPA's SEO problem. Keep the Workers-backed
> Pages build above.

## SEO notes

- Every `/movie/*` and `/tv/*` page returns unique `<title>`, meta description,
  canonical, Open Graph/Twitter tags, and `Movie`/`TVSeries` JSON-LD in the
  **initial HTML** — no JS execution required to index.
- ISR refreshes title data on a 24h cadence; the sitemap regenerates daily from
  trending content, so new titles get discovered without a manual prerender step.
- SSR makes pages **crawlable and indexable** — it does not make them rank
  instantly. Indexing still depends on discovery, crawl budget, and site
  authority. Submit `sitemap.xml` in Google Search Console after deploying.

## Notes / parity gaps vs. the original

- The legacy `scripts/prerender.mjs` and committed `movie/*.html` / `tv/*.html`
  snapshots are obsolete here — SSR/ISR replaces them.
- The ad/popunder inline script and Google Analytics placeholder from the old
  `index.html` were intentionally left out; add GA via `next/script` if wanted.
- The MutationObserver iframe anti-tamper guard from the old `videoModal.js` was
  dropped; re-add in `PlayerModal.tsx` if you relied on it.
