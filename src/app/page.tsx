import { Suspense } from "react";
import { addMonths, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Header } from "@/components/layout/header";
import { EventCalendarWrapper } from "@/components/calendar/event-calendar-wrapper";
import { CalendarLoadError } from "@/components/calendar/calendar-load-error";
import { prisma, resetPrismaClient } from "@/lib/prisma";
import { generateRecurrenceInstances } from "@/lib/recurrence";
import type { CalendarEvent } from "@/lib/types";

const MAX_DB_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

function isConnectionError(err: unknown): boolean {
  if (err && typeof err === "object" && "code" in err) {
    return (err as { code?: string }).code === "P1001";
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("Can't reach database server");
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

// Ensure calendar always fetches fresh events (e.g. after admin approval)
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getEvents(): Promise<
  { events: CalendarEvent[]; error?: string }
> {
  const now = new Date();
  const rangeStart = startOfDay(addMonths(now, -1));
  const rangeEnd = endOfDay(addMonths(now, 12));

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_DB_RETRIES; attempt++) {
    try {
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
          monthlyPattern: event.recurrenceRule.monthlyPattern ?? "BY_DATE",
          monthlyDayOfWeek:
            event.recurrenceRule.monthlyDayOfWeek ?? undefined,
          monthlyWeeks: event.recurrenceRule.monthlyWeeks ?? [],
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

      return { events: calendarEvents };
    } catch (error) {
      lastError = error;
      if (isConnectionError(error) && attempt < MAX_DB_RETRIES) {
        await resetPrismaClient();
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      break;
    }
  }

  console.error("Error fetching events:", lastError);
  return { events: [], error: "Failed to load events" };
}

export default async function HomePage() {
  const { events, error } = await getEvents();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<CalendarSkeleton />}>
          <div className="h-[calc(100vh-56px)]">
            {error ? (
              <CalendarLoadError />
            ) : (
              <EventCalendarWrapper events={events} />
            )}
          </div>
        </Suspense>
      </main>
    </div>
  );
}
