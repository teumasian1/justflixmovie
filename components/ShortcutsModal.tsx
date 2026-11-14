'use client';

import { useState, useEffect } from 'react';
import Icon from './Icon';

export const SHORTCUTS_EVENT = 'jfm:open-shortcuts';

export function openShortcuts() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SHORTCUTS_EVENT));
  }
}

export default function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(SHORTCUTS_EVENT, onOpen);

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(SHORTCUTS_EVENT, onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="shortcuts-modal-backdrop"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div className="shortcuts-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <div className="shortcuts-title-row">
            <span className="shortcuts-hud-tag">SYSTEM TELEMETRY</span>
            <h3>Keyboard Controls</h3>
          </div>
          <button
            type="button"
            className="shortcuts-close-btn"
            onClick={() => setOpen(false)}
            aria-label="Close shortcuts"
          >
            <Icon name="times" />
          </button>
        </div>

        <div className="shortcuts-grid">
          <div className="shortcut-row">
            <span className="shortcut-desc">Switch streaming mirror</span>
            <div className="shortcut-keys"><kbd>1</kbd> - <kbd>7</kbd></div>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-desc">Previous / Next episode</span>
            <div className="shortcut-keys"><kbd>[</kbd> <kbd>]</kbd></div>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-desc">Close player or dialog</span>
            <div className="shortcut-keys"><kbd>ESC</kbd></div>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-desc">Focus live search</span>
            <div className="shortcut-keys"><kbd>/</kbd></div>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-desc">Surprise Me generator</span>
            <div className="shortcut-keys"><kbd>M</kbd></div>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-desc">Toggle keyboard cheat sheet</span>
            <div className="shortcut-keys"><kbd>?</kbd></div>
          </div>
        </div>

        <div className="shortcuts-footer">
          <span>Tip: Press <kbd>?</kbd> anytime anywhere on the site</span>
        </div>
      </div>
    </div>
  );
}
