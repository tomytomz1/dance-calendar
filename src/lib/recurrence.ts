import {
  addDays,
  addWeeks,
  addMonths,
  isBefore,
  isAfter,
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
}

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
  const duration = differenceInMinutes(endTime, startTime);

  let currentStart = new Date(startTime);
  let instanceCount = 0;

  const hasValidUntil =
    config.until && isAfter(config.until, startTime);
  const maxDate = hasValidUntil ? (config.until as Date) : addMonths(startTime, 12);
  const maxCount = config.count || maxInstances;

  while (instanceCount < maxCount && isBefore(currentStart, maxDate)) {
    if (config.frequency === "WEEKLY" && config.daysOfWeek?.length) {
      const dayOfWeek = currentStart.getDay();
      if (config.daysOfWeek.includes(dayOfWeek)) {
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
          currentStart = addMonths(currentStart, config.interval);
          break;
      }
    }
  }

  return instances;
}

export async function createEventInstances(
  eventId: string,
  instances: GeneratedInstance[]
): Promise<number> {
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

export async function generateInstancesForEvent(eventId: string): Promise<number> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { recurrenceRule: true },
  });

  if (!event || !event.isRecurring || !event.recurrenceRule) {
    return 0;
  }

  const config: RecurrenceConfig = {
    frequency: event.recurrenceRule.frequency,
    interval: event.recurrenceRule.interval,
    daysOfWeek: event.recurrenceRule.daysOfWeek,
    until: event.recurrenceRule.until || undefined,
    count: event.recurrenceRule.count || undefined,
  };

  const instances = generateRecurrenceInstances(
    event.startTime,
    event.endTime,
    config
  );

  const futureInstances = instances.filter((i) =>
    isAfter(i.startTime, new Date())
  );

  return createEventInstances(eventId, futureInstances);
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
  limit: number = 10
) {
  return prisma.eventInstance.findMany({
    where: {
      eventId,
      startTime: { gte: new Date() },
      isCancelled: false,
    },
    orderBy: { startTime: "asc" },
    take: limit,
  });
}
