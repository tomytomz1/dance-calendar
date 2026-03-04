"use client";

import { useRef } from "react";
import { motion, AnimatePresence, PanInfo, useDragControls } from "framer-motion";
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
import { useScrollSync } from "@/hooks/use-scroll-sync";
import type { CalendarEvent } from "@/lib/types";

interface MobileMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  direction: number;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSwipe: (direction: number) => void;
}

export function MobileMonthView({
  currentDate,
  events,
  direction,
  onDateSelect,
  onEventClick,
  onSwipe,
}: MobileMonthViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const { registerSection, scrollToSection } = useScrollSync(
    scrollContainerRef,
    onDateSelect,
    monthStart.toISOString(),
    { viewType: "month" }
  );

  const handleDayClick = (d: Date) => {
    onDateSelect(d);
    if (getEventsForDay(d).length > 0) scrollToSection(d);
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
    <div className="flex-1 overflow-hidden touch-pan-y flex flex-col">
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
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="h-full flex flex-col"
        >
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: "none" }}
            className="shrink-0"
          >
            <div className="grid grid-cols-7 border-b bg-muted/30">
              {weekDays.map((d) => (
                <div
                  key={d}
                  className="text-center py-2 text-xs font-medium text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 shrink-0">
            {calendarDays.map((day) => {
              const eventsForDay = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const isSelected = isSameDay(day, currentDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "flex flex-col items-center justify-center p-1.5 border-r border-b last:border-r-0 min-h-[44px] transition-colors",
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
          </div>

          <div
            ref={scrollContainerRef}
            className="px-4 pb-4 pt-0 space-y-6 border-t bg-card flex-1 overflow-y-auto overscroll-y-contain touch-pan-y min-h-0 [-webkit-overflow-scrolling:touch]"
          >
            {calendarDays
              .filter((d) => getEventsForDay(d).length > 0)
              .map((d) => {
                const dayEvents = getEventsForDay(d);
                return (
                  <section
                    key={d.toISOString()}
                    ref={(el) => registerSection(d, el)}
                    data-date={d.toISOString()}
                    className="space-y-2"
                  >
                    <h3
                      className={cn(
                        "font-semibold text-sm text-muted-foreground bg-card py-1 z-10",
                        isSameDay(d, currentDate) && "sticky top-0"
                      )}
                    >
                      {format(d, "EEEE, MMMM d")}
                    </h3>
                    {dayEvents.map((event) => (
                      <button
                        key={event.instanceKey ?? event.id}
                        onClick={() => onEventClick(event)}
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
