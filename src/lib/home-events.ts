import { addMonths, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateRecurrenceInstances } from "@/lib/recurrence";
import { tryDb } from "@/lib/with-db-retry";
import type { SeoEventRecord } from "@/lib/seo";
import type { CalendarEvent } from "@/lib/types";

const seoEventSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  venue: true,
  address: true,
  city: true,
  danceStyles: true,
  startTime: true,
  endTime: true,
  imageUrl: true,
  ticketUrl: true,
  price: true,
  status: true,
  updatedAt: true,
  isRecurring: true,
  organizer: { select: { name: true } },
  recurrenceRule: true,
} as const;

type HomeEventRow = Prisma.EventGetPayload<{ select: typeof seoEventSelect }>;

export type HomeListEventRecord = SeoEventRecord & { instanceKey?: string };

export type HomePageEventsResult = {
  calendarEvents: CalendarEvent[];
  listEvents: HomeListEventRecord[];
  error?: string;
};

function toListRecord(
  event: HomeEventRow,
  startTime: Date,
  endTime: Date,
  instanceKey?: string
): HomeListEventRecord {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    venue: event.venue,
    address: event.address,
    city: event.city,
    danceStyles: event.danceStyles,
    startTime,
    endTime,
    imageUrl: event.imageUrl,
    ticketUrl: event.ticketUrl,
    price: event.price,
    status: event.status,
    updatedAt: event.updatedAt,
    organizer: event.organizer,
    ...(instanceKey ? { instanceKey } : {}),
  };
}

function expandEvent(
  event: HomeEventRow,
  rangeStart: Date,
  rangeEnd: Date,
  calendarEvents: CalendarEvent[],
  listEvents: HomeListEventRecord[]
) {
  const baseCalendar = {
    id: event.id,
    title: event.title,
    venue: event.venue,
    city: event.city,
    danceStyles: event.danceStyles,
    status: event.status,
    isRecurring: event.isRecurring,
    organizerName: event.organizer.name || "Unknown Organizer",
    slug: event.slug ?? undefined,
  };

  if (!event.isRecurring || !event.recurrenceRule) {
    calendarEvents.push({
      ...baseCalendar,
      start: event.startTime,
      end: event.endTime,
    });
    listEvents.push(toListRecord(event, event.startTime, event.endTime));
    return;
  }

  const rule = event.recurrenceRule;
  const config = {
    frequency: rule.frequency,
    interval: rule.interval,
    daysOfWeek: rule.daysOfWeek,
    until: rule.until ?? undefined,
    count: rule.count ?? undefined,
    monthlyPattern: rule.monthlyPattern ?? "BY_DATE",
    monthlyDayOfWeek: rule.monthlyDayOfWeek ?? undefined,
    monthlyWeeks: rule.monthlyWeeks ?? [],
  };

  const instances = generateRecurrenceInstances(
    event.startTime,
    event.endTime,
    config
  );

  const instancesInRange = instances.filter((i) =>
    isWithinInterval(i.startTime, { start: rangeStart, end: rangeEnd })
  );

  for (const instance of instancesInRange) {
    const instanceKey = `${event.id}-${instance.startTime.toISOString()}`;
    calendarEvents.push({
      ...baseCalendar,
      start: instance.startTime,
      end: instance.endTime,
      instanceKey,
    });
    listEvents.push(
      toListRecord(event, instance.startTime, instance.endTime, instanceKey)
    );
  }
}

/** Same date range and recurrence expansion for homepage calendar and list tabs. */
export async function getHomePageEvents(): Promise<HomePageEventsResult> {
  const now = new Date();
  const rangeStart = startOfDay(addMonths(now, -1));
  const rangeEnd = endOfDay(addMonths(now, 12));

  const result = await tryDb("getHomePageEvents", async () => {
    const calendarWhere: Prisma.EventWhereInput = {
      status: "APPROVED",
      OR: [
        {
          isRecurring: false,
          startTime: { lte: rangeEnd },
          endTime: { gte: rangeStart },
        },
        {
          isRecurring: true,
          startTime: { lte: rangeEnd },
          OR: [
            { recurrenceRule: null },
            { recurrenceRule: { until: null } },
            { recurrenceRule: { until: { gte: rangeStart } } },
          ],
        },
      ],
    };

    const events = await prisma.event.findMany({
      where: calendarWhere,
      select: seoEventSelect,
      orderBy: { startTime: "asc" },
    });

    const calendarEvents: CalendarEvent[] = [];
    const listEvents: HomeListEventRecord[] = [];

    for (const event of events) {
      expandEvent(event, rangeStart, rangeEnd, calendarEvents, listEvents);
    }

    calendarEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    listEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return { calendarEvents, listEvents };
  });

  if (!result.ok) {
    return {
      calendarEvents: [],
      listEvents: [],
      error: "Failed to load events",
    };
  }

  return result.data;
}
