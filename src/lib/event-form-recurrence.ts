import type { RecurrenceRule } from '@prisma/client';
import { fromSiteWallClock } from '@/lib/timezone';

interface RecurrenceFields {
  isRecurring: boolean;
  recurrenceFrequency?: RecurrenceRule['frequency'];
  recurrenceUntil?: Date;
  monthlyPattern?: RecurrenceRule['monthlyPattern'];
  monthlyDayOfWeek?: number;
  monthlyWeeks?: number[];
}

/** Preserve rule settings the editor does not expose instead of silently resetting them. */
export function eventFormRecurrence(data: RecurrenceFields, existing?: RecurrenceRule | null) {
  const frequency = data.recurrenceFrequency ?? existing?.frequency;
  if (!data.isRecurring || !frequency) return undefined;
  const sameFrequency = existing?.frequency === frequency;
  return {
    frequency,
    interval: sameFrequency ? existing.interval : 1,
    daysOfWeek: sameFrequency ? existing.daysOfWeek : [],
    count: existing?.count ?? undefined,
    until: data.recurrenceUntil ? fromSiteWallClock(data.recurrenceUntil).toISOString() : undefined,
    ...(frequency === 'MONTHLY' && {
      monthlyPattern: data.monthlyPattern ?? existing?.monthlyPattern ?? 'BY_DATE',
      monthlyDayOfWeek: data.monthlyDayOfWeek ?? existing?.monthlyDayOfWeek ?? undefined,
      monthlyWeeks: data.monthlyWeeks ?? existing?.monthlyWeeks ?? [],
    }),
  };
}
