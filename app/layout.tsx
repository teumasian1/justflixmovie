import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ModalProvider } from '@/components/ModalContext';
import Navbar from '@/components/Navbar';
import PlayerModal from '@/components/PlayerModal';
import Popunder from '@/components/Popunder';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://justflixmovies.pages.dev';

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
    'Watch free movies and TV shows online in HD quality. Stream trending movies, popular TV series, anime, and Korean dramas. No registration required. JustFlixMovies.',
  keywords:
    'watch movies online free, free movies, tv shows, streaming, watch series online, anime, korean drama, HD movies, trending movies, new releases',
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
    images: ['/lulu.png'],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JustFlixMovies - Watch Free Movies & TV Shows',
    description:
      'Watch free movies and TV shows online in HD. Stream trending movies, anime, K-dramas, and more.',
    images: ['/lulu.png'],
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
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
        />
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
        <ModalProvider>
          <Navbar />
          {children}
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
