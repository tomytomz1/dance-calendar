import { expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CalendarEventChip } from '@/components/calendar/calendar-event-chip';
import { MobileMonthView } from '@/components/calendar/mobile-month-view';
import { MobileWeekView } from '@/components/calendar/mobile-week-view';
import { WeekView } from '@/components/calendar/week-view';
import type { CalendarEvent } from '@/lib/types';

const date = new Date(2026, 10, 13, 20, 30);
const events: CalendarEvent[] = ['Alpha social', 'Beta social', 'Gamma social'].map((title, id) => ({ id: String(id), title, start: date, end: new Date(2026, 10, 14, 1), venue: 'QA venue', city: 'Troy', danceStyles: ['Salsa'], status: 'APPROVED', isRecurring: false, organizerName: 'Synthetic' }));
const props = { currentDate: date, events, direction: 0, onDateSelect() {}, onEventClick() {}, onSwipe() {} };
const normalize = (text: string) => text.toLowerCase().replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
function checkLabels(html: string) {
  const buttons = [...html.matchAll(/<button\b[^>]*aria-label="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)];
  expect(buttons.length).toBeGreaterThan(0);
  for (const [, name, content] of buttons) {
    const visible = normalize(content.replace(/<[^>]+>/g, ''));
    expect(normalize(name), `Visible text: ${visible}`).toContain(visible);
  }
}
it('includes the visible time/title in an event chip name', () => {
  checkLabels(renderToStaticMarkup(createElement(CalendarEventChip, { event: events[0], variant: 'month' })));
});
it('includes visible day numbers, event titles and overflow counts in mobile month names', () => {
  checkLabels(renderToStaticMarkup(createElement(MobileMonthView, props)));
});
it('includes visible weekday/day/title content in mobile week names', () => {
  checkLabels(renderToStaticMarkup(createElement(MobileWeekView, props)));
});
it('includes abbreviated visible weekday/day content in desktop week names', () => {
  checkLabels(renderToStaticMarkup(createElement(WeekView, props)));
});
