import { expect, it } from 'vitest';
import { parseTimeTo12Hour, toHHmm } from '@/lib/event-time';
it.each([
  ['00:20', 12, '20', 'AM'], ['12:59', 12, '59', 'PM'],
  ['20:20', 8, '20', 'PM'], ['23:59', 11, '59', 'PM'],
] as const)('preserves exact minutes and AM/PM for %s', (stored, hour, minute, period) => {
  expect(parseTimeTo12Hour(stored)).toEqual({ hour, minute, period });
  expect(toHHmm(hour, minute, period)).toBe(stored);
});
