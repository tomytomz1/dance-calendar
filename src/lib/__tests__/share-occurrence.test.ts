import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
import { EventShareImage } from '@/components/events/event-share-image';
import { resolveEventOccurrence } from '@/lib/event-detail';
import { formatInSiteTimeZone, pinProcessTimeZone } from '@/lib/timezone';
const event = { startTime: new Date('2026-04-19T01:00Z'), endTime: new Date('2026-04-19T06:00Z'), isRecurring: true, recurrenceRule: { frequency: 'MONTHLY' as const, interval: 1, daysOfWeek: [], count: null, until: null, monthlyPattern: 'BY_WEEKDAY' as const, monthlyDayOfWeek: 6, monthlyWeeks: [3] } };
it('renders the corrected Michigan occurrence in social artwork instead of the next default date', () => {
  pinProcessTimeZone();
  const { start } = resolveEventOccurrence(event, '2026-12-19T17:00:00.000Z', new Date('2026-11-05T12:00Z'));
  const dateLabel = formatInSiteTimeZone(start, 'yyyy-MM-dd h:mm a');
  expect(dateLabel).toBe('2026-12-19 9:00 PM');
  const html = renderToStaticMarkup(createElement(EventShareImage, { title: 'Synthetic Monthly Social', dateLabel, venue: 'Synthetic venue', city: 'Royal Oak', danceStyles: ['Bachata'] }));
  expect(html).toContain('2026-12-19 9:00 PM'); expect(html).not.toContain('2026-11-21');
});
