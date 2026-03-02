"use client";

import { useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarEventChip } from "./calendar-event-chip";
import type { CalendarEvent } from "@/lib/types";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  direction: number;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSwipe: (direction: number) => void;
}

export function MonthView({
  currentDate,
  events,
  direction,
  onDateSelect,
  onEventClick,
  onSwipe,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarStart, calendarEnd]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      onSwipe(-1);
    } else if (info.offset.x < -threshold) {
      onSwipe(1);
    }
  };

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start), date));
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex-1 overflow-hidden touch-pan-y">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={monthStart.toISOString()}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="h-full flex flex-col"
        >
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center py-2 text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1">
            {calendarDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const isSelected = isSameDay(day, currentDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateSelect(day)}
                  className={cn(
                    "flex flex-col items-center p-1 border-r border-b last:border-r-0 min-h-[60px] transition-colors",
                    !isCurrentMonth && "bg-muted/20",
                    isSelected && "bg-primary/5",
                    "hover:bg-muted/50 active:bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-sm",
                      !isCurrentMonth && "text-muted-foreground/50",
                      isCurrentDay && "bg-primary text-primary-foreground font-bold",
                      isSelected && !isCurrentDay && "bg-secondary font-medium"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-col gap-0.5 w-full mt-1 px-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <CalendarEventChip
                        key={event.id}
                        event={event}
                        variant="month"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      />
                    ))}
                  </div>
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-muted-foreground">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 space-y-2 border-t bg-card max-h-[200px] overflow-y-auto">
            <h3 className="font-semibold text-sm text-muted-foreground">
              {format(currentDate, "EEEE, MMMM d")}
            </h3>
            {getEventsForDay(currentDate).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                No events scheduled
              </p>
            ) : (
              getEventsForDay(currentDate).map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full text-left p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-sm">{event.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.start), "h:mm a")} - {event.venue}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {event.danceStyles.map((style) => (
                        <span
                          key={style}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
