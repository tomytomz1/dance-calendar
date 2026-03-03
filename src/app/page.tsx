import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { EventCalendar } from "@/components/calendar/event-calendar";
import { prisma } from "@/lib/prisma";
import type { CalendarEvent } from "@/lib/types";

// Ensure calendar always fetches fresh events (e.g. after admin approval)
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getEvents(): Promise<CalendarEvent[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: "APPROVED",
        startTime: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
      include: {
        organizer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startTime,
      end: event.endTime,
      venue: event.venue,
      city: event.city,
      danceStyles: event.danceStyles,
      status: event.status,
      isRecurring: event.isRecurring,
      organizerName: event.organizer.name || "Unknown Organizer",
    }));
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
