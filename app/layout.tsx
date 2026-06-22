import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ModalProvider } from '@/components/ModalContext';
import Navbar from '@/components/Navbar';
import PlayerModal from '@/components/PlayerModal';
import Popunder from '@/components/Popunder';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://justflixmovies.online';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // `default` is used as-is on the homepage; `template` appends the brand to
  // every other page's title (e.g. "Browse …" -> "Browse … | JustFlixMovies").
  // Detail pages opt out via title.absolute since they already include the brand.
  title: {
    default: 'JustFlixMovies - Watch Free Movies & TV Shows Online in HD',
    template: '%s | JustFlixMovies',
  },
  applicationName: 'JustFlixMovies',
  description:
    'Watch free movies and TV shows online in HD. Stream trending movies, popular TV series, anime, and Korean dramas — no registration required.',
  keywords:
    'movies to watch, good movies to watch, movies to watch on netflix, watch free movies, watch free movies online, what movie should i watch, watch movies online free, website to watch movies for free, fun movies to watch, great movies to watch, horror movies to watch, sites for watching free movies, classic movies to watch, comedy movies to watch, family movies to watch, movie to watch with family, hd movies, free full movies, tv shows, anime, korean drama, trending movies',
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
  icons: { icon: '/lulu.png', apple: '/lulu.png' },
  openGraph: {
    type: 'website',
    siteName: 'JustFlixMovies',
    title: 'JustFlixMovies - Watch Free Movies & TV Shows Online in HD',
    description:
      'Watch free movies and TV shows online in HD quality. Stream trending movies, popular TV series, anime, and Korean dramas.',
    url: SITE_URL,
    // Declare the real dimensions of the OG image (lulu.png is 1536×1024) so
    // social platforms render the card without a reflow/refetch.
    images: [{ url: '/lulu.png', width: 1536, height: 1024 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JustFlixMovies - Watch Free Movies & TV Shows',
    description:
      'Watch free movies and TV shows online in HD. Stream trending movies, anime, K-dramas, and more.',
    images: [{ url: '/lulu.png', width: 1536, height: 1024 }],
  },
};

export const viewport: Viewport = {
  themeColor: '#160a1f',
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
    target: `${SITE_URL}/?q={search_term_string}`,
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

// Set the persisted theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Syne:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        {/*
          Font Awesome loaded non-render-blocking: fetched as a `print`
          stylesheet (the browser deprioritises it and doesn't block paint),
          then a tiny inline script flips it to `all` on load. <noscript>
          keeps icons working with JS disabled. Removes the render-blocking
          3rd-party CSS without touching any icon markup.
        */}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link
          id="fa-css"
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
          media="print"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.getElementById('fa-css');if(!l)return;function s(){l.media='all';}if(l.sheet){s();}else{l.addEventListener('load',s);}})();`,
          }}
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-css-tags */}
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          />
        </noscript>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
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
          <a href="/">Stream Movies</a>
          <a href="/">Watch TV Shows</a>
          <a href="/browse">Browse Genres</a>
        </div>
      </div>
    </footer>
  );
}
