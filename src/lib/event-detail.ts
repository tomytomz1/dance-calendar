import { cache } from "react";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { generateRecurrenceInstances } from "@/lib/recurrence";
import { formatInSiteTimeZone } from "@/lib/timezone";

/** Approved event by id or slug, with organizer and recurrence rule (deduped per request). */
export const getApprovedEventByIdOrSlug = cache(async (idOrSlug: string) =>
  prisma.event.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], status: "APPROVED" },
    include: {
      organizer: {
        select: { id: true, name: true, image: true, bio: true },
      },
      recurrenceRule: true,
    },
  })
);

type OccurrenceSource = {
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrenceRule: {
    frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    interval: number;
    daysOfWeek: number[];
    until: Date | null;
    count: number | null;
    monthlyPattern: "BY_DATE" | "BY_WEEKDAY";
    monthlyDayOfWeek: number | null;
    monthlyWeeks: number[];
  } | null;
};

/**
 * The occurrence a detail page should show: the one named by `?instance=`
 * (recurring events only), otherwise the next upcoming occurrence of a
 * recurring series, otherwise the event's own start/end.
 */
export function resolveEventOccurrence(
  event: OccurrenceSource,
  instanceParam?: string | null,
  now: Date = new Date()
): { start: Date; end: Date; isSpecificInstance: boolean } {
  const duration = event.endTime.getTime() - event.startTime.getTime();
  const requested =
    event.isRecurring && instanceParam && !Number.isNaN(Date.parse(instanceParam))
      ? new Date(instanceParam)
      : null;

  if (event.isRecurring && event.recurrenceRule) {
    const rule = event.recurrenceRule;
    const horizon = addMonths(now, 13);
    const instances = generateRecurrenceInstances(event.startTime, event.endTime, {
      frequency: rule.frequency,
      interval: rule.interval,
      daysOfWeek: rule.daysOfWeek,
      until: rule.until ?? undefined,
      count: rule.count ?? undefined,
      monthlyPattern: rule.monthlyPattern ?? "BY_DATE",
      monthlyDayOfWeek: rule.monthlyDayOfWeek ?? undefined,
      monthlyWeeks: rule.monthlyWeeks ?? [],
      horizon:
        requested && requested > horizon ? addMonths(requested, 1) : horizon,
    });

    if (requested) {
      // `?instance=` names an occurrence by its start instant. Match it to the
      // series on the same Michigan calendar day, so links shared before the
      // organizer corrected the start time still show the current time
      // instead of echoing the stale one from the URL.
      const day = formatInSiteTimeZone(requested, "yyyy-MM-dd");
      const match = instances.find(
        (instance) => formatInSiteTimeZone(instance.startTime, "yyyy-MM-dd") === day
      );
      if (match) {
        return { start: match.startTime, end: match.endTime, isSpecificInstance: true };
      }
    }

    const next = instances.find((instance) => instance.endTime >= now);
    if (next) {
      return { start: next.startTime, end: next.endTime, isSpecificInstance: false };
    }
  } else if (requested) {
    return { start: requested, end: new Date(requested.getTime() + duration), isSpecificInstance: true };
  }

  return { start: event.startTime, end: event.endTime, isSpecificInstance: false };
}
