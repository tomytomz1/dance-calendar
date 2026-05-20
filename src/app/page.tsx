import { Suspense } from "react";
import type { Metadata } from "next";
import { addMonths, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Prisma } from "@prisma/client";
import { Header } from "@/components/layout/header";
import { EventCalendarWrapper } from "@/components/calendar/event-calendar-wrapper";
import { CalendarLoadError } from "@/components/calendar/calendar-load-error";
import { JsonLdScript } from "@/components/seo/json-ld";
import { UpcomingEventsList } from "@/components/seo/upcoming-events-list";
import {
  buildItemListJsonLd,
  getUpcomingApprovedEvents,
  SITE_NAME,
} from "@/lib/seo";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";
import { prisma, resetPrismaClient } from "@/lib/prisma";
import { generateRecurrenceInstances } from "@/lib/recurrence";
import type { CalendarEvent } from "@/lib/types";

const MAX_DB_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const SEO_LIST_LIMIT = 30;

export const revalidate = 300;

export const metadata: Metadata = buildPublicPageMetadata({
  title: `${SITE_NAME} — Dance Events in Michigan`,
  description:
    "Find salsa, bachata, kizomba, swing, and ballroom dance events across Michigan. Browse the calendar or see upcoming socials and classes listed below.",
  path: "/",
});

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

function isConnectionError(err: unknown): boolean {
  if (err && typeof err === "object" && "code" in err) {
    return (err as { code?: string }).code === "P1001";
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("Can't reach database server");
}

async function getEvents(): Promise<
  { events: CalendarEvent[]; error?: string }
> {
  const now = new Date();
  const rangeStart = startOfDay(addMonths(now, -1));
  const rangeEnd = endOfDay(addMonths(now, 12));

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_DB_RETRIES; attempt++) {
    try {
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
          slug: event.slug ?? undefined,
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
  const [{ events, error }, seoEvents] = await Promise.all([
    getEvents(),
    getUpcomingApprovedEvents({ limit: SEO_LIST_LIMIT }),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLdScript
        data={buildItemListJsonLd(
          seoEvents,
          "Upcoming dance events in Michigan"
        )}
      />
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
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl font-bold pt-8 pb-2">
            Dance Events in Michigan
          </h1>
          <p className="text-muted-foreground mb-4">
            Browse salsa, bachata, kizomba, swing, and ballroom socials on the
            calendar above, or explore upcoming listings below.
          </p>
          <UpcomingEventsList
            events={seoEvents}
            heading="Upcoming events"
            showHubLinks
            listId="home-upcoming-events"
          />
        </div>
      </main>
    </div>
  );
}
