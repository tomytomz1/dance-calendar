"use client";

import { useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useScrollSync } from "@/hooks/use-scroll-sync";
import type { CalendarEvent } from "@/lib/types";

interface MobileWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  direction: number;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSwipe: (direction: number) => void;
}

function EventCard({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium truncate text-sm">{event.title}</h4>
          <span className="text-xs text-muted-foreground shrink-0">
            {format(new Date(event.start), "h:mm a")} -{" "}
            {format(new Date(event.end), "h:mm a")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{event.venue}</p>
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
  );
}

export function MobileWeekView({
  currentDate,
  events,
  direction,
  onDateSelect,
  onEventClick,
  onSwipe,
}: MobileWeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const { registerSection, scrollToSection } = useScrollSync(
    scrollContainerRef,
    onDateSelect,
    weekStart.toISOString(),
    { viewType: "week" }
  );

  useEffect(() => {
    const id = setTimeout(() => scrollToSection(currentDate), 100);
    return () => clearTimeout(id);
  }, [weekStart.toISOString(), scrollToSection, currentDate]);

  const handleDayClick = (day: Date) => {
    onDateSelect(day);
    if (getEventsForDay(day).length > 0) scrollToSection(day);
  };

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
    enter: (d: number) => ({
      x: d > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({
      x: d < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <div className="flex-1 overflow-hidden touch-pan-y flex flex-col">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={weekStart.toISOString()}
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
                key={day.toISOString()}
                className="text-center py-2 text-xs font-medium text-muted-foreground"
              >
                {format(day, "EEE")}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 shrink-0">
            {weekDays.map((day) => {
              const eventsForDay = getEventsForDay(day);
              const isCurrentDay = isToday(day);
              const isSelected = isSameDay(day, currentDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 border-r border-b last:border-r-0 min-h-[52px] transition-colors",
                    isSelected && "bg-primary/5",
                    "hover:bg-muted/50 active:bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium",
                      isCurrentDay && "bg-primary text-primary-foreground",
                      isSelected && !isCurrentDay && "bg-secondary"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex items-center justify-center gap-0.5 mt-0.5">
                    {eventsForDay.length === 0 ? null : eventsForDay.length <= 3 ? (
                      Array.from({ length: eventsForDay.length }).map((_, i) => (
                        <span
                          key={i}
                          className="w-1 h-1 rounded-full bg-primary/60"
                        />
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        +{eventsForDay.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div
            ref={scrollContainerRef}
            className="px-4 pb-4 pt-0 space-y-6 border-t bg-card flex-1 overflow-y-auto min-h-0"
          >
            {weekDays
              .filter((day) => getEventsForDay(day).length > 0)
              .map((day) => {
                const dayEvents = getEventsForDay(day);
                return (
                  <section
                    key={day.toISOString()}
                    ref={(el) => registerSection(day, el)}
                    data-date={day.toISOString()}
                    className="space-y-2"
                  >
                    <h3
                      className={cn(
                        "font-semibold text-sm text-muted-foreground bg-card py-1 z-10",
                        isSameDay(day, currentDate) && "sticky top-0"
                      )}
                    >
                      {format(day, "EEEE, MMMM d")}
                    </h3>
                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.instanceKey ?? event.id}
                        event={event}
                        onClick={() => onEventClick(event)}
                      />
                    ))}
                  </section>
                );
              })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
