"use client";

import { format } from "date-fns";
import { CalendarDays, MapPin } from "lucide-react";
import { CalendarEventListItem } from "./calendar-event-list-item";
import type { CalendarEvent } from "@/lib/types";

interface SelectedDayAgendaProps {
  /** Michigan wall-clock date (see toSiteWallClock). */
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  /** Shown in the empty state, e.g. "Choose a highlighted date to see its events." */
  emptyHint?: string;
}

/** Desktop side panel listing the selected day's events (month and week views). */
export function SelectedDayAgenda({
  date,
  events,
  onEventClick,
  emptyHint = "Choose a highlighted date to see its events.",
}: SelectedDayAgendaProps) {
  return (
    <aside
      className="rounded-2xl border border-[#87546E] bg-[linear-gradient(150deg,#42273B,#1A1522_55%)] p-4 sm:p-5"
      aria-labelledby="selected-date-heading"
    >
      <p className="text-xs font-bold uppercase tracking-[.12em] text-[#D6B5CB]">
        {format(date, "EEEE, MMMM d, yyyy")}
      </p>
      <h3 id="selected-date-heading" className="mt-2 text-2xl font-extrabold text-[#FFF1E5]">
        Events on {format(date, "MMM d")}
      </h3>
      <div className="mb-5 mt-3 h-1 w-20 rounded-full bg-[#F46157]" aria-hidden="true" />
      <div aria-live="polite">
        {events.length ? (
          <div className="space-y-3">
            {events.map((event) => (
              <CalendarEventListItem
                key={event.instanceKey ?? event.id}
                event={event}
                onClick={() => onEventClick(event)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#694E65] bg-[#1C1623] p-6 text-center">
            <CalendarDays className="mx-auto mb-3 text-[#FF8179]" size={30} aria-hidden="true" />
            <p className="font-semibold text-[#FFF1E5]">No dances listed for this day</p>
            <p className="mt-2 text-sm text-[#D2C0D0]">{emptyHint}</p>
          </div>
        )}
      </div>
      <p className="mt-5 flex items-center gap-2 text-xs text-[#D4C1D1]">
        <MapPin size={14} className="shrink-0 text-[#FF8179]" aria-hidden="true" /> Times are Michigan time.
        Details are provided by event organizers.
      </p>
    </aside>
  );
}
