'use client';

import { openShortcuts } from './ShortcutsModal';

export default function ShortcutsTrigger() {
  return (
    <button
      type="button"
      className="shortcuts-trigger-btn"
      onClick={openShortcuts}
      title="View keyboard shortcuts (?)"
    >
      <kbd>?</kbd> Shortcuts
    </button>
  );
}
