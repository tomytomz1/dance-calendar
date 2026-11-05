import { revalidatePath } from 'next/cache';

/** A published save must reach cached calendars, lists, hubs and shared URLs. */
export function invalidatePublicEventPages(event: { id: string; slug?: string | null }): void {
  for (const path of ['/', '/calendar', '/events', '/sitemap.xml']) revalidatePath(path);
  revalidatePath('/events/city/[city]', 'page');
  revalidatePath('/events/style/[style]', 'page');
  revalidatePath(`/event/${event.id}`);
  if (event.slug) revalidatePath(`/event/${event.slug}`);
}
