'use client';

import { useEffect, useState } from 'react';

// Global brutalist chrome: a one-shot boot-sequence overlay on first paint,
// a fixed scroll-progress hairline that tracks document scroll, and a
// back-to-top button that appears once the user scrolls down. All have their
// styling defined in globals.css; this component just mounts them and drives
// the scroll behaviour. Honours reduced-motion by skipping the boot overlay.

export default function SystemChrome() {
  // Show the boot overlay only on the very first mount of a session, and never
  // when the user prefers reduced motion. Gated to client so SSR markup stays
  // identical between server and hydration (overlay is added post-mount).
  const [showBoot, setShowBoot] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    // Only on a genuine first load this session — skip on client-side nav.
    if (sessionStorage.getItem('booted') === '1') return;
    sessionStorage.setItem('booted', '1');
    setShowBoot(true);
    // The CSS animation fades the overlay out at ~0.55s; unmount just after so
    // it never lingers in the DOM.
    const id = setTimeout(() => setShowBoot(false), 700);
    return () => clearTimeout(id);
  }, []);

  // Drive the scroll-progress hairline + the back-to-top visibility. Writes a
  // 0..1 scale into --p, which the CSS maps to transform: scaleX(). rAF-throttled
  // so scroll stays smooth.
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('.scroll-progress');
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const top = doc.scrollTop;
      const p = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0;
      bar?.style.setProperty('--p', p.toFixed(4));
      // Reveal the back-to-top button after scrolling ~1.5 viewports down.
      setShowTop(top > window.innerHeight * 1.5);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Staggered reveal for browse/search grids. Adds `.reveal-ready` to <body>
  // (which arms the hidden initial state) and observes every `.grid-reveal`;
  // when one enters the viewport it gains `.is-visible`, triggering the CSS
  // rise+fade transition with a per-card stagger. Re-scans when the DOM changes
  // so newly-rendered grids (e.g. browse results after a filter) get observed.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.body.classList.add('reveal-ready');

    const observed = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>('.grid-reveal').forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          io.observe(el);
        }
      });
    };
    scan();
    // Watch for grids rendered after a filter/page change.
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  const scrollTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      {showBoot && (
        <div className="boot-seq" aria-hidden="true">
          INITIALISING FREE_STREAM_TERMINAL
        </div>
      )}
      <button
        type="button"
        className={`back-to-top ${showTop ? 'is-visible' : ''}`}
        onClick={scrollTop}
        aria-label="Back to top"
        aria-hidden={!showTop}
        tabIndex={showTop ? 0 : -1}
      >
        <i className="fas fa-arrow-up" />
      </button>
    </>
  );
}
