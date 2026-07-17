'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useModal } from './ModalContext';
import Icon from './Icon';

// Bottom mobile tab bar — a thumb-friendly alternative to reaching the top
// navbar on phones. Shown only on small screens (via CSS), and mirrors the
// primary destinations: Home, Browse, and Search. The active tab is derived
// from the pathname. Hidden while the player modal is open so it never clashes
// with the full-screen player.

export default function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { item } = useModal();

  const isHome = pathname === '/' || pathname === '/home';
  const isBrowse = pathname === '/browse';
  const isSearch = pathname === '/search';

  const goSearch = () => router.push('/search');

  return (
    <nav className="mobile-tabbar" aria-label="Primary" hidden={!!item}>
      <Link href="/home" className={`mobile-tab ${isHome ? 'active' : ''}`} aria-current={isHome ? 'page' : undefined} tabIndex={item ? -1 : 0}>
        <Icon name="home" />
        <span>Home</span>
      </Link>
      <Link href="/browse" className={`mobile-tab ${isBrowse ? 'active' : ''}`} aria-current={isBrowse ? 'page' : undefined} tabIndex={item ? -1 : 0}>
        <Icon name="film" />
        <span>Browse</span>
      </Link>
      <button type="button" onClick={goSearch} className={`mobile-tab ${isSearch ? 'active' : ''}`} aria-current={isSearch ? 'page' : undefined} tabIndex={item ? -1 : 0}>
        <Icon name="search" />
        <span>Search</span>
      </button>
    </nav>
  );
}

