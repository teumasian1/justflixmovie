import Link from 'next/link';
import type { Metadata } from 'next';
import Icon from '@/components/Icon';

// Custom 404 page. Kept on-brand (brutalist HUD language) and genuinely useful:
// it offers the three real entry points a visitor is likely to want, instead
// of the bare Next.js "page not found".

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="not-found" aria-label="Page not found">
      <div className="not-found-inner">
        <span className="banner-kicker">
          <span className="kicker-type">Error 404</span>
        </span>
        <h1>Signal Lost</h1>
        <p>
          The page you were looking for isn&apos;t here. It may have moved, been removed, or never
          existed. Pick a path below to get back to watching.
        </p>
        <div className="not-found-actions">
          <Link href="/home" className="banner-button play">
            <Icon name="home" /> Go Home
          </Link>
          <Link href="/browse" className="banner-button more-info">
            <Icon name="film" /> Browse Titles
          </Link>
          <Link href="/search" className="banner-button more-info">
            <Icon name="search" /> Search
          </Link>
        </div>
      </div>
    </section>
  );
}
