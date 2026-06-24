'use client';

import { useEffect, useState } from 'react';

// Global brutalist chrome: a one-shot boot-sequence overlay on first paint and
// a fixed scroll-progress hairline that tracks document scroll. Both have their
// styling defined in globals.css (.boot-seq / .scroll-progress); this component
// just mounts them and drives the scroll bar. Honours reduced-motion by skipping
// the boot overlay entirely.

export default function SystemChrome() {
  // Show the boot overlay only on the very first mount of a session, and never
  // when the user prefers reduced motion. Gated to client so SSR markup stays
  // identical between server and hydration (overlay is added post-mount).
  const [showBoot, setShowBoot] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    // Only on a genuine first load this session — skip on client-side nav.
    if (sessionStorage.getItem('booted') === '1') return;
    sessionStorage.setItem('booted', '1');
    setShowBoot(true);
    // The CSS animation fades the overlay out at ~1.15s; unmount just after so
    // it never traps pointer events.
    const id = setTimeout(() => setShowBoot(false), 1400);
    return () => clearTimeout(id);
  }, []);

  // Drive the scroll-progress hairline. Writes a 0..1 scale into --p, which the
  // CSS maps to transform: scaleX(). rAF-throttled so scroll stays smooth.
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('.scroll-progress');
    if (!bar) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      bar.style.setProperty('--p', p.toFixed(4));
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

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      {showBoot && (
        <div className="boot-seq" aria-hidden="true">
          INITIALISING FREE_STREAM_TERMINAL
        </div>
      )}
    </>
  );
}
