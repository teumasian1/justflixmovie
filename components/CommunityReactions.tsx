'use client';

import { useState, useEffect } from 'react';

interface ReactionDef {
  id: string;
  emoji: string;
  label: string;
}

const REACTIONS: ReactionDef[] = [
  { id: 'fire', emoji: '🔥', label: 'Masterpiece' },
  { id: 'mindblown', emoji: '🤯', label: 'Mind-Blowing' },
  { id: 'spooky', emoji: '💀', label: 'Terrifying' },
  { id: 'tears', emoji: '😭', label: 'Tearjerker' },
  { id: 'popcorn', emoji: '🍿', label: 'Pure Fun' },
];

const STORAGE_KEY = 'jfm:user-reactions';

export default function CommunityReactions({ itemId }: { itemId: number }) {
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Generate deterministic base community counts from the item ID
    const base: Record<string, number> = {};
    REACTIONS.forEach((r, idx) => {
      const seed = Math.abs((itemId * (idx + 7) * 9301 + 49297) % 233280);
      base[r.id] = (seed % 45) + 12;
    });

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[itemId]) {
          setActiveReaction(parsed[itemId]);
          base[parsed[itemId]] = (base[parsed[itemId]] || 0) + 1;
        }
      }
    } catch {
      /* ignore */
    }

    setCounts(base);
  }, [itemId]);

  const toggleReaction = (rid: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const store = raw ? JSON.parse(raw) : {};
      const prev = activeReaction;

      if (prev === rid) {
        // Untoggle
        delete store[itemId];
        setActiveReaction(null);
        setCounts((c) => ({ ...c, [rid]: Math.max(0, (c[rid] || 1) - 1) }));
      } else {
        // Toggle new
        store[itemId] = rid;
        setActiveReaction(rid);
        setCounts((c) => {
          const next = { ...c };
          if (prev && next[prev]) next[prev] = Math.max(0, next[prev] - 1);
          next[rid] = (next[rid] || 0) + 1;
          return next;
        });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="community-reactions-section">
      <div className="reactions-header">
        <span className="reactions-kicker">AUDIENCE VIBES</span>
        <span className="reactions-subtitle">Tap to tag how this title made you feel</span>
      </div>
      <div className="reactions-grid">
        {REACTIONS.map((r) => {
          const isActive = activeReaction === r.id;
          const count = counts[r.id] ?? 0;
          return (
            <button
              key={r.id}
              type="button"
              className={`reaction-pill ${isActive ? 'active' : ''}`}
              onClick={() => toggleReaction(r.id)}
              aria-pressed={isActive}
            >
              <span className="reaction-emoji">{r.emoji}</span>
              <span className="reaction-label">{r.label}</span>
              <span className="reaction-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
