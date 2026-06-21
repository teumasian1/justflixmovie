// SEO slug helpers — mirror the original site's `name-id` URL scheme so links
// like /movie/avatar-fire-and-ash-83533 keep working and map to TMDB ids.

export function slugify(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

export function titleOf(item: { title?: string; name?: string }): string {
  return item.title || item.name || 'Untitled';
}

export function buildHref(
  type: 'movie' | 'tv',
  item: { id: number; title?: string; name?: string }
): string {
  const slug = slugify(titleOf(item));
  // `.*-id` — keep the trailing id even when the slug is empty (non-ASCII titles).
  return `/${type}/${slug ? `${slug}-` : ''}${item.id}`;
}

// Pull the trailing TMDB id out of a `[slug]` route segment: "avatar-83533" -> "83533".
export function idFromSlug(slug: string): string | null {
  const m = decodeURIComponent(slug).match(/(?:.*-)?(\d+)$/);
  return m ? m[1] : null;
}

export function yearOf(dateStr?: string): number | null {
  if (!dateStr) return null;
  const y = new Date(dateStr).getFullYear();
  return Number.isNaN(y) ? null : y;
}
