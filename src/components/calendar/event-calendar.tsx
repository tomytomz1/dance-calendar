"use client";

import { useState, useCallback } from "react";
import { addWeeks, addMonths, subWeeks, subMonths } from "date-fns";
import { CalendarHeader } from "./calendar-header";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { EventDetailSheet } from "../events/event-detail-sheet";
import type { CalendarEvent } from "@/lib/types";

interface EventCalendarProps {
  events: CalendarEvent[];
  initialDate?: Date;
}

export function EventCalendar({ events, initialDate = new Date() }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<"week" | "month">("week");
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
    setCurrentDate(new Date());
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
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

  return (
    <div className="flex flex-col h-full bg-background">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onViewChange={setView}
      />

      {view === "week" ? (
        <WeekView
          currentDate={currentDate}
          events={events}
          direction={direction}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          onSwipe={handleSwipe}
        />
      ) : (
        <MonthView
          currentDate={currentDate}
          events={events}
          direction={direction}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          onSwipe={handleSwipe}
        />
      )}

      <EventDetailSheet
        event={selectedEvent}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </div>
  );
}
