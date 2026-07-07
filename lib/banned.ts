// TMDB IDs that must never be shown anywhere on the site.
// Add a number here to hide a title from all listings, search, recommendations,
// the home banner, the sitemap, SEO JSON-LD, and to 404 its direct detail URL.
export const BANNED_IDS: Set<number> = new Set([
  1083381, // Backrooms
  1301421, // The Sheep Detectives
  220102, // Spider-Noir
]);

// True when the given TMDB id (string or number) is on the ban list.
export const isBannedId = (
  id: string | number | undefined | null
): boolean => {
  if (id === undefined || id === null) return false;
  const n = typeof id === 'number' ? id : Number(id);
  return Number.isFinite(n) && BANNED_IDS.has(n);
};

// Strip every banned item from a list of TMDB items.
export const filterBanned = <T extends { id: number }>(items: T[]): T[] =>
  items.filter((i) => !BANNED_IDS.has(i.id));
