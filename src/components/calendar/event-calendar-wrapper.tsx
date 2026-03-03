"use client";

import dynamic from "next/dynamic";
import type { CalendarEvent } from "@/lib/types";

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

const EventCalendar = dynamic(
  () =>
    import("./event-calendar").then((mod) => mod.EventCalendar),
  { ssr: false, loading: () => <CalendarSkeleton /> }
);

interface EventCalendarWrapperProps {
  events: CalendarEvent[];
}

export function EventCalendarWrapper({ events }: EventCalendarWrapperProps) {
  return <EventCalendar events={events} />;
}
