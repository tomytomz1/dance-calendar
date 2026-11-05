import { createElement } from 'react';
import { ImageResponse } from 'next/og';
import { EventShareImage } from '@/components/events/event-share-image';
import { getApprovedEventByIdOrSlug, resolveEventOccurrence } from '@/lib/event-detail';
import { formatEventDateForMeta, normalizeCityName } from '@/lib/seo';
import { normalizeVenueName } from '@/lib/city-name';
import { formatInSiteTimeZone } from '@/lib/timezone';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getApprovedEventByIdOrSlug(id);
  if (!event) return new Response('Event not found', { status: 404 });
  const { start } = resolveEventOccurrence(event, new URL(request.url).searchParams.get('instance'));
  return new ImageResponse(createElement(EventShareImage, {
    title: event.title,
    dateLabel: `${formatEventDateForMeta(start)} · ${formatInSiteTimeZone(start, 'h:mm a')} Michigan time`,
    venue: normalizeVenueName(event.venue),
    city: normalizeCityName(event.city),
    danceStyles: event.danceStyles,
  }), { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=300, must-revalidate' } });
}
