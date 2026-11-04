import { expect, it } from 'vitest';
import { indexCalendarEvents, calendarDayKey } from '@/lib/calendar-event-days';
import { toSiteWallClock } from '@/lib/timezone';
it.each(['America/Detroit', 'UTC', 'America/Los_Angeles', 'Asia/Tokyo'])('buckets an overnight Michigan event on November 13 in %s', zone => {
  const original = process.env.TZ; process.env.TZ = zone;
  try {
    const event = { id: 'hoover', start: toSiteWallClock('2026-11-14T01:30Z') };
    const days = indexCalendarEvents([event]);
    expect(days.get(calendarDayKey(new Date(2026, 10, 13)))).toEqual([event]);
    expect(days.has(calendarDayKey(new Date(2026, 10, 14)))).toBe(false);
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
});
it('preserves event order and indexes each event only once', () => {
  const events = Array.from({ length: 1000 }, (_, id) => ({ id, start: new Date(2027, 0, id % 28 + 1, 21) }));
  const days = indexCalendarEvents(events);
  expect([...days.values()].flat()).toHaveLength(1000);
  expect(days.get(calendarDayKey(events[0].start))?.map(e => e.id)).toEqual(events.filter(e => e.start.getDate() === 1).map(e => e.id));
});
