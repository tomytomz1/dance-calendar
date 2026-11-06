"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { addWeeks, addMonths, subWeeks, subMonths } from "date-fns";
import { CalendarHeader } from "./calendar-header";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { MobileWeekView } from "./mobile-week-view";
import { MobileMonthView } from "./mobile-month-view";
import { EventDetailSheet } from "../events/event-detail-sheet";
import type { CalendarEvent } from "@/lib/types";
import { siteNow, toSiteWallClock } from "@/lib/timezone";
import { useMobileViewport } from "@/hooks/use-mobile-viewport";

interface EventCalendarProps {
  events: CalendarEvent[];
  /** Michigan wall-clock date to open on (defaults to today in Michigan). */
  initialDate?: Date;
}

export function EventCalendar({ events: rawEvents, initialDate }: EventCalendarProps) {
  const isMobile = useMobileViewport();
  const sheetTriggerRef = useRef<HTMLElement | null>(null);
  // Bucket and label events in Michigan time for every visitor, wherever their
  // device clock is set. The original instant is kept in occurrenceStart.
  const events = useMemo(
    () =>
      rawEvents.map((event) => ({
        ...event,
        start: toSiteWallClock(event.start),
        end: toSiteWallClock(event.end),
      })),
    [rawEvents]
  );
  const [currentDate, setCurrentDate] = useState(() => initialDate ?? siteNow());
  const [view, setView] = useState<"week" | "month">("month");
  const [direction, setDirection] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handlePrevious = useCallback(() => {
    setDirection(-1);
    setCurrentDate((prev) =>
      view === "week" ? subWeeks(prev, 1) : subMonths(prev, 1)
    );
  }, [view]);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentDate((prev) =>
      view === "week" ? addWeeks(prev, 1) : addMonths(prev, 1)
    );
  }, [view]);

  const handleToday = useCallback(() => {
    setDirection(0);
    setCurrentDate(siteNow());
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    sheetTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedEvent(event);
    setIsSheetOpen(true);
  }, []);

  const handleSwipe = useCallback(
    (swipeDirection: number) => {
      if (swipeDirection > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    },
    [handleNext, handlePrevious]
  );

  const CalendarView = view === "week"
    ? (isMobile ? MobileWeekView : WeekView)
    : (isMobile ? MobileMonthView : MonthView);

  return (
    <div className="flex flex-col bg-[#191421] md:h-full">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onViewChange={setView}
      />

      <div className={isMobile ? "w-full max-w-full overflow-x-hidden" : "flex flex-1 flex-col min-h-0 overflow-hidden"}>
        <CalendarView
          currentDate={currentDate}
          events={events}
          direction={direction}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          onSwipe={handleSwipe}
        />
      </div>

      <EventDetailSheet
        event={selectedEvent}
        returnFocusRef={sheetTriggerRef}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </div>
  );
}
