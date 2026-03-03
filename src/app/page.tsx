import { Suspense } from "react";
import { addMonths, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Header } from "@/components/layout/header";
import { EventCalendar } from "@/components/calendar/event-calendar";
import { prisma } from "@/lib/prisma";
import { generateRecurrenceInstances } from "@/lib/recurrence";
import type { CalendarEvent } from "@/lib/types";

// Ensure calendar always fetches fresh events (e.g. after admin approval)
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getEvents(): Promise<CalendarEvent[]> {
  try {
    const now = new Date();
    const rangeStart = startOfDay(addMonths(now, -1));
    const rangeEnd = endOfDay(addMonths(now, 4));

    const events = await prisma.event.findMany({
      where: {
        status: "APPROVED",
        startTime: {
          gte: rangeStart,
        },
      },
      include: {
        organizer: {
          select: {
            name: true,
          },
        },
        recurrenceRule: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    const calendarEvents: CalendarEvent[] = [];

    for (const event of events) {
      const baseEvent = {
        id: event.id,
        title: event.title,
        venue: event.venue,
        city: event.city,
        danceStyles: event.danceStyles,
        status: event.status,
        isRecurring: event.isRecurring,
        organizerName: event.organizer.name || "Unknown Organizer",
      };

      if (!event.isRecurring || !event.recurrenceRule) {
        calendarEvents.push({
          ...baseEvent,
          start: event.startTime,
          end: event.endTime,
        });
        continue;
      }

      const config = {
        frequency: event.recurrenceRule.frequency,
        interval: event.recurrenceRule.interval,
        daysOfWeek: event.recurrenceRule.daysOfWeek,
        until: event.recurrenceRule.until ?? undefined,
        count: event.recurrenceRule.count ?? undefined,
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
        calendarEvents.push({
          ...baseEvent,
          start: instance.startTime,
          end: instance.endTime,
          instanceKey: `${event.id}-${instance.startTime.toISOString()}`,
        });
      }
    }

    calendarEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    return calendarEvents;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

function CalendarSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="p-4 space-y-3 border-b">
        <div className="h-7 w-48 bg-muted animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
          <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<CalendarSkeleton />}>
          <div className="h-[calc(100vh-56px)]">
            <EventCalendar events={events} />
          </div>
        </Suspense>
      </main>
    </div>
  );
}
