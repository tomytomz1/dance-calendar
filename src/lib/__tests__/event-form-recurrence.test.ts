import { expect, it } from 'vitest';
import type { RecurrenceRule } from '@prisma/client';
import { eventFormRecurrence } from '@/lib/event-form-recurrence';
const existing = { frequency: 'WEEKLY', interval: 2, daysOfWeek: [2, 5], count: 8, until: null, monthlyPattern: 'BY_DATE', monthlyDayOfWeek: null, monthlyWeeks: [] } as unknown as RecurrenceRule;
it('preserves the interval, selected weekdays and count while editing other event fields', () => {
  expect(eventFormRecurrence({ isRecurring: true, recurrenceFrequency: 'WEEKLY' }, existing)).toMatchObject({ frequency: 'WEEKLY', interval: 2, daysOfWeek: [2, 5], count: 8 });
});
it('does not submit a recurrence rule for a disabled series', () => {
  expect(eventFormRecurrence({ isRecurring: false, recurrenceFrequency: 'WEEKLY' }, existing)).toBeUndefined();
});
it('clears the until boundary while retaining an existing explicit count', () => {
  expect(eventFormRecurrence({ isRecurring: true }, existing)).toMatchObject({ count: 8, until: undefined });
});
it('does not carry weekly day selection into a different frequency', () => {
  expect(eventFormRecurrence({ isRecurring: true, recurrenceFrequency: 'MONTHLY', monthlyPattern: 'BY_WEEKDAY', monthlyDayOfWeek: 5, monthlyWeeks: [3, -1] }, existing)).toMatchObject({ interval: 1, daysOfWeek: [], monthlyWeeks: [3, -1], monthlyDayOfWeek: 5 });
});
