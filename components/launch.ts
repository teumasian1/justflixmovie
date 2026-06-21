// Grand "hero" launch animation, ported from js/videoModal.js (launchFromPoster).
// On poster click the artwork + a neon play puck fly to screen centre as the
// modal opens. Falls back to opening immediately when reduced motion is on or
// the source image is unavailable. `onOpen(delayMs)` receives the recommended
// typewriter start delay so the modal can hold its text until the overlay clears.

export function launchFromPoster(
  sourceEl: HTMLElement | null,
  onOpen: (typeDelay: number) => void
) {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const img = sourceEl?.querySelector('img') as HTMLImageElement | null;
  const rect = img ? img.getBoundingClientRect() : null;

  if (reduce || !rect || !rect.width || !rect.height) {
    onOpen(420);
    return;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const layer = document.createElement('div');
  layer.className = 'poster-launch-layer flash';

  const clone = document.createElement('div');
  clone.className = 'poster-launch';
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  clone.style.backgroundImage = `url("${img!.currentSrc || img!.src}")`;

  const pcx = rect.left + rect.width / 2;
  const pcy = rect.top + rect.height / 2;
  const puck = document.createElement('div');
  puck.className = 'poster-launch-puck';
  puck.style.left = pcx + 'px';
  puck.style.top = pcy + 'px';
  puck.style.setProperty('--dx', vw / 2 - pcx + 'px');
  puck.style.setProperty('--dy', vh / 2 - pcy + 'px');

  layer.appendChild(clone);
  layer.appendChild(puck);
  document.body.appendChild(layer);

  const coverScale = Math.max(vw / rect.width, vh / rect.height);
  const targetX = (vw - rect.width * coverScale) / 2;
  const targetY = (vh - rect.height * coverScale) / 2;

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${targetX - rect.left}px, ${targetY - rect.top}px) scale(${coverScale})`;
    clone.style.borderRadius = '0';
    puck.classList.add('go');
  });

  setTimeout(() => onOpen(820), 240);
  setTimeout(() => {
    layer.style.opacity = '0';
  }, 660);
  setTimeout(() => layer.remove(), 1020);
}
