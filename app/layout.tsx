import type { Metadata, Viewport } from 'next';
import { Inter, Oswald, Space_Mono } from 'next/font/google';
import Link from 'next/link';
import Script from 'next/script';
import './globals.css';

// Self-hosted fonts via next/font: downloaded & inlined at build time, served
// from the same origin (/_next/static/media/). Zero render-blocking external
// stylesheets, zero third-party DNS/TLS handshakes, no <script> media-swap
// hack — the previous fonts.googleapis.com / fonts.gstatic.com chain (2
// preconnects + a deferred <link> + an inline flip script) is gone entirely.
// Each font exposes a CSS variable consumed by the --font-* tokens in
// globals.css. display:'swap' keeps text visible in the system fallback until
// the web font arrives (no invisible-text / FOIT).
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});
import { ModalProvider } from '@/components/ModalContext';
import Navbar from '@/components/Navbar';
import PlayerModal from '@/components/PlayerModal';
import Popunder from '@/components/Popunder';
import SystemChrome from '@/components/SystemChrome';
import MobileTabBar from '@/components/MobileTabBar';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.justflixmovies.online';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // `default` is used as-is on the homepage; `template` appends the brand to
  // every other page's title (e.g. "Browse …" -> "Browse … | JustFlixMovies").
  // Detail pages opt out via title.absolute since they already include the brand.
  title: {
    default: 'Watch Free Movies & TV Shows Online in HD - JustFlixMovies',
    template: '%s | JustFlixMovies',
  },
  applicationName: 'JustFlixMovies',
  description:
    'Watch free movies and TV shows online in HD on JustFlixMovies. Stream trending films, popular series, anime, and Korean dramas instantly — no sign-up, no subscription.',
  authors: [{ name: 'JustFlixMovies' }],
  creator: 'JustFlixMovies',
  publisher: 'JustFlixMovies',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: '/' },
  // Google Search Console ownership verification (ported from the old site so
  // you can verify the domain and submit the sitemap).
  verification: { google: 'jrk3yYrSslYrfXTXmEpH3QDLLQ7IwNRTWOGh-lkqpJE' },
  manifest: '/manifest.json',
  // Favicon + apple-touch: serve right-sized PNGs (32/192px) instead of the
  // 1536×1024 / 179KB source the browsers would otherwise downscale on every
  // visit. The full lulu.png is kept only for the OG/social image below.
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'JustFlixMovies',
    title: 'Watch Free Movies & TV Shows Online in HD - JustFlixMovies',
    description:
      'Stream free movies, TV series, anime, and Korean dramas online in HD — no sign-up, no subscription. Press play and watch instantly on JustFlixMovies.',
    url: SITE_URL,
    // Declare the real dimensions of the OG image (lulu.png is 1536×1024) so
    // social platforms render the card without a reflow/refetch.
    images: [{ url: '/lulu.png', width: 1536, height: 1024 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watch Free Movies & TV Shows Online in HD - JustFlixMovies',
    description:
      'Stream free movies, TV series, anime, and K-dramas in HD — no sign-up, no subscription. Watch instantly on JustFlixMovies.',
    images: [{ url: '/lulu.png', width: 1536, height: 1024 }],
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

// WebSite schema → enables the brand name + sitelinks search box in results.
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'JustFlixMovies',
  alternateName: 'JustFlix Movies',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

// Organization schema → tells Google the official site name + logo to show.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'JustFlixMovies',
  url: SITE_URL,
  logo: `${SITE_URL}/lulu.png`,
  description:
    'Watch free movies and TV shows online in HD. Trending movies, TV series, anime, and Korean dramas — no registration required.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable} ${spaceMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* Google Analytics (gtag.js) — lazyOnload so it never competes with
            hydration or first input. The preconnect above warms the TLS
            handshake so the script starts fetching the moment it's queued. */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-97H1PC2ED9"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-97H1PC2ED9');
          `}
        </Script>
        <Popunder />
      </head>
      <body>
        {/* Skip link: first focusable element, jumps past the nav to <main>. */}
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ModalProvider>
          <Navbar />
          {/* Single <main> landmark for every page; also the skip-link target. */}
          <main id="main-content">{children}</main>
          <Footer />
          <PlayerModal />
          <SystemChrome />
          <MobileTabBar />
        </ModalProvider>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>JustFlixMovies does not host any files; it merely pulls streams from third-party services.</p>
        <p>
          Legal issues should be taken up with the file hosts and providers. JustFlixMovies is not
          responsible for any media files shown by the video providers.
        </p>
        <div className="footer-links">
          <Link href="/home">Stream Movies</Link>
          <Link href="/browse?type=tv">Watch TV Shows</Link>
          <Link href="/browse">Browse Genres</Link>
          <Link href="/search">Search Titles</Link>
        </div>
      </div>
    </footer>
  );
}
