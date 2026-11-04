import {
  addDays,
  addWeeks,
  addMonths,
  endOfMonth,
  startOfMonth,
  isBefore,
  isAfter,
  endOfDay,
  startOfWeek,
  differenceInCalendarWeeks,
  differenceInMinutes,
} from "date-fns";
import { prisma } from "./prisma";
import type { RecurrenceFrequency } from "@prisma/client";

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[];
  until?: Date;
  count?: number;
  monthlyPattern?: "BY_DATE" | "BY_WEEKDAY";
  monthlyDayOfWeek?: number;
  monthlyWeeks?: number[];
  /**
   * For open-ended series (no `until`/`count`): generate occurrences up to this
   * date instead of only the first 12 months after the series started, so
   * long-running weekly/monthly events keep appearing.
   */
  horizon?: Date;
}

/** Safety cap on occurrences when a horizon is given. */
const MAX_HORIZON_INSTANCES = 1000;

export interface GeneratedInstance {
  startTime: Date;
  endTime: Date;
}

export function generateRecurrenceInstances(
  startTime: Date,
  endTime: Date,
  config: RecurrenceConfig,
  maxInstances: number = 52
): GeneratedInstance[] {
  const instances: GeneratedInstance[] = [];
  if (!Number.isFinite(+startTime) || !Number.isFinite(+endTime) || endTime <= startTime ||
      !Number.isInteger(config.interval) || config.interval < 1 ||
      (config.count !== undefined && (!Number.isInteger(config.count) || config.count < 1)) ||
      (config.until && !Number.isFinite(+config.until))) return instances;
  if (config.frequency === "WEEKLY" && config.daysOfWeek?.length &&
      !config.daysOfWeek.some((d) => Number.isInteger(d) && d >= 0 && d <= 6)) return instances;
  const duration = differenceInMinutes(endTime, startTime);

  let currentStart = new Date(startTime);
  let instanceCount = 0;

  // `until` comes from a calendar date picker: include that entire Michigan day.
  const until = config.until ? endOfDay(config.until) : undefined;
  const openEndedLimit = config.horizon ?? addMonths(startTime, 12);
  const maxDate = until ?? (config.count ? new Date(8640000000000000) : openEndedLimit);
  const maxCount = Math.min(config.count ?? (config.horizon ? MAX_HORIZON_INSTANCES : maxInstances), MAX_HORIZON_INSTANCES);

  // Special handling for advanced monthly patterns (e.g. 2nd Friday, last Sunday)
  if (
    config.frequency === "MONTHLY" &&
    config.monthlyPattern === "BY_WEEKDAY" &&
    typeof config.monthlyDayOfWeek === "number" &&
    config.monthlyWeeks &&
    config.monthlyWeeks.length > 0
  ) {
    const weekday = config.monthlyDayOfWeek;
    const monthInterval = config.interval || 1;

    let monthCursor = startOfMonth(startTime);

    while (instanceCount < maxCount && isBefore(monthCursor, maxDate)) {
      const firstOfMonth = monthCursor;
      const lastOfMonth = endOfMonth(monthCursor);

      // First occurrence of the target weekday in this month
      const firstDowOffset =
        (weekday - firstOfMonth.getDay() + 7) % 7;
      const firstDow = addDays(firstOfMonth, firstDowOffset);

      for (const week of [...new Set(config.monthlyWeeks)].sort((a, b) => (a === -1 ? 6 : a) - (b === -1 ? 6 : b))) {
        let candidate: Date | null = null;

        if (week > 0) {
          const nth = addWeeks(firstDow, week - 1);
          if (nth.getMonth() === firstOfMonth.getMonth()) {
            candidate = nth;
          }
        } else if (week === -1) {
          // Last occurrence of the weekday in this month
          let lastDow = lastOfMonth;
          while (lastDow.getDay() !== weekday) {
            lastDow = addDays(lastDow, -1);
          }
          candidate = lastDow;
        }

        if (!candidate) continue;

        // Combine candidate date with original event time-of-day
        const instanceStart = new Date(
          candidate.getFullYear(),
          candidate.getMonth(),
          candidate.getDate(),
          startTime.getHours(),
          startTime.getMinutes(),
          startTime.getSeconds(),
          startTime.getMilliseconds()
        );

        if (!isBefore(instanceStart, startTime)) {
          if (instanceStart <= maxDate && instanceCount < maxCount && !instances.some((i) => +i.startTime === +instanceStart)) {
            const instanceEnd = new Date(
              instanceStart.getTime() + duration * 60 * 1000
            );
            instances.push({
              startTime: instanceStart,
              endTime: instanceEnd,
            });
            instanceCount++;
          }
        }
      }

      monthCursor = addMonths(monthCursor, monthInterval);
    }

    instances.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    return instances;
  }

  while (instanceCount < maxCount && currentStart <= maxDate) {
    if (config.frequency === "WEEKLY" && config.daysOfWeek?.length) {
      const dayOfWeek = currentStart.getDay();
      if (config.daysOfWeek.includes(dayOfWeek) &&
          differenceInCalendarWeeks(currentStart, startOfWeek(startTime)) % config.interval === 0) {
        instances.push({
          startTime: new Date(currentStart),
          endTime: new Date(currentStart.getTime() + duration * 60 * 1000),
        });
        instanceCount++;
      }
      currentStart = addDays(currentStart, 1);
    } else {
      instances.push({
        startTime: new Date(currentStart),
        endTime: new Date(currentStart.getTime() + duration * 60 * 1000),
      });
      instanceCount++;

      switch (config.frequency) {
        case "DAILY":
          currentStart = addDays(currentStart, config.interval);
          break;
        case "WEEKLY":
          currentStart = addWeeks(currentStart, config.interval);
          break;
        case "BIWEEKLY":
          currentStart = addWeeks(currentStart, 2 * config.interval);
          break;
        case "MONTHLY":
          currentStart = addMonths(startTime, instanceCount * config.interval);
          break;
      }
    }
  }

  return instances;
}

/**
 * Drops occurrences whose start instant is already stored (or repeated in
 * the batch), so regenerating a series is idempotent.
 */
export function excludeExistingInstances(
  instances: GeneratedInstance[],
  existingStartTimes: Date[]
): GeneratedInstance[] {
  const seen = new Set(existingStartTimes.map((d) => d.getTime()));
  return instances.filter((instance) => {
    const key = instance.startTime.getTime();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function createEventInstances(
  eventId: string,
  instances: GeneratedInstance[]
): Promise<number> {
  if (instances.length === 0) return 0;
  const data = instances.map((instance) => ({
    eventId,
    startTime: instance.startTime,
    endTime: instance.endTime,
    isCancelled: false,
    isModified: false,
  }));

  const result = await prisma.eventInstance.createMany({
    data,
    skipDuplicates: true,
  });

  return result.count;
}

export async function generateInstancesForEvent(
  eventId: string,
  options: { replaceFuture?: boolean } = {}
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    // All generation entry points lock the same parent before reading instances.
    // Under READ COMMITTED a waiter sees the first writer's committed rows.
    await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;

    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: { recurrenceRule: true },
    });

    if (!event || !event.isRecurring || !event.recurrenceRule) {
      return 0;
    }

    if (options.replaceFuture) {
      await tx.eventInstance.deleteMany({ where: {
        eventId, startTime: { gt: new Date() }, isModified: false, isCancelled: false,
      } });
    }
    const config: RecurrenceConfig = {
      frequency: event.recurrenceRule.frequency,
      interval: event.recurrenceRule.interval,
      daysOfWeek: event.recurrenceRule.daysOfWeek,
      until: event.recurrenceRule.until || undefined,
      count: event.recurrenceRule.count || undefined,
      monthlyPattern: event.recurrenceRule.monthlyPattern || "BY_DATE",
      monthlyDayOfWeek: event.recurrenceRule.monthlyDayOfWeek ?? undefined,
      monthlyWeeks: event.recurrenceRule.monthlyWeeks ?? [],
      horizon: addMonths(new Date(), 13),
    };

    const instances = generateRecurrenceInstances(
      event.startTime,
      event.endTime,
      config
    );

    const futureInstances = instances.filter((i) =>
      isAfter(i.startTime, new Date())
    );
    if (futureInstances.length === 0) return 0;

    // EventInstance has no unique (eventId, startTime) constraint, so
    // `skipDuplicates` cannot catch repeats: skip occurrences already stored,
    // otherwise every weekly cron run inserts another copy of each date.
    const existing = await tx.eventInstance.findMany({
      where: {
        eventId,
        startTime: { gte: futureInstances[0].startTime, lte: futureInstances.at(-1)!.startTime },
      },
      select: { startTime: true },
    });

    const pending = excludeExistingInstances(futureInstances, existing.map((e) => e.startTime));
    if (!pending.length) return 0;
    const inserted = await tx.eventInstance.createMany({ data: pending.map((i) => ({ ...i, eventId })) });
    return inserted.count;
  }, { isolationLevel: "ReadCommitted", timeout: 15000 });
}

export async function cancelEventInstance(instanceId: string): Promise<void> {
  await prisma.eventInstance.update({
    where: { id: instanceId },
    data: { isCancelled: true },
  });
}

export async function modifyEventInstance(
  instanceId: string,
  modifications: {
    startTime?: Date;
    endTime?: Date;
    modifiedTitle?: string;
    modifiedVenue?: string;
  }
): Promise<void> {
  await prisma.eventInstance.update({
    where: { id: instanceId },
    data: {
      ...modifications,
      isModified: true,
    },
  });
}

export async function getUpcomingInstances(
  eventId: string,
  limit: number = 10,
  options?: { requireApprovedParent?: boolean }
) {
  return prisma.eventInstance.findMany({
    where: {
      eventId,
      startTime: { gte: new Date() },
      isCancelled: false,
      ...(options?.requireApprovedParent
        ? { Event: { status: "APPROVED" as const } }
        : {}),
    },
    orderBy: { startTime: "asc" },
    take: limit,
  });
}
