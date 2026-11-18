import { revalidatePath } from 'next/cache';

/** A published save must reach cached calendars, lists, hubs and shared URLs. */
export function invalidatePublicEventPages(event: { id: string; slug?: string | null }): void {
  for (const path of ['/', '/calendar', '/events', '/sitemap.xml']) revalidatePath(path);
  revalidatePath('/events/city/[city]', 'page');
  revalidatePath('/events/style/[style]', 'page');
  revalidatePath(`/event/${event.id}`);
  if (event.slug) revalidatePath(`/event/${event.slug}`);
}

/**
 * An organizer's name is shown on every one of their events, in the cached
 * calendar data, lists and hub pages. Refresh all of them after a rename so
 * the new name appears right away instead of after the ISR window.
 */
export function invalidateOrganizerPublicPages(events: { id: string; slug?: string | null }[]): void {
  for (const path of ['/', '/calendar', '/events']) revalidatePath(path);
  revalidatePath('/events/city/[city]', 'page');
  revalidatePath('/events/style/[style]', 'page');
  for (const event of events) {
    revalidatePath(`/event/${event.id}`);
    if (event.slug) revalidatePath(`/event/${event.slug}`);
  }
}
