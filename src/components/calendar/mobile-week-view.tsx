"use client";

import { useRef, useMemo } from "react";
import { motion, AnimatePresence, PanInfo, useDragControls } from "framer-motion";
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
import { CalendarEventChip } from "./calendar-event-chip";
import { CalendarEventListItem } from "./calendar-event-list-item";

interface MobileWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  direction: number;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSwipe: (direction: number) => void;
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
  const dragControls = useDragControls();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const { registerSection, scrollToSection } = useScrollSync(
    scrollContainerRef,
    onDateSelect,
    weekStart.toISOString(),
    { viewType: "week", scrollRoot: "viewport" }
  );

  const handleDayClick = (day: Date) => {
    onDateSelect(day);
    if (getEventsForDay(day).length > 0) scrollToSection(day);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      onSwipe(-1);
    } else if (info.offset.x < -threshold) {
      onSwipe(1);
    }
  };

  const getEventsForDay = (date: Date) => {
    return events.filter((event) =>
      isSameDay(new Date(event.start), date)
    );
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

  const daysWithEvents = weekDays.filter((day) => getEventsForDay(day).length > 0);

  return (
    <div className="flex w-full max-w-full flex-col overflow-x-hidden">
      <div className="overflow-x-hidden">
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
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="w-full shrink-0 overflow-x-hidden"
          >
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: "none" }}
              className="shrink-0"
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
                        "flex flex-col items-center justify-center p-1 border-r border-b last:border-r-0 min-h-[52px] transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        isSelected && "bg-primary/5",
                        "hover:bg-muted/50 active:bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium",
                          isCurrentDay &&
                            "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1",
                          isSelected && !isCurrentDay && "bg-secondary"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="flex flex-col gap-0.5 w-full mt-0.5 px-0.5 min-w-0">
                        {eventsForDay.slice(0, 2).map((event) => (
                          <CalendarEventChip
                            key={event.instanceKey ?? event.id}
                            event={event}
                            variant="month-compact"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                          />
                        ))}
                        {eventsForDay.length > 2 && (
                          <span className="text-xs text-muted-foreground text-center">
                            +{eventsForDay.length - 2}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        ref={scrollContainerRef}
        className="touch-pan-y border-t bg-card px-4 pb-24 pt-0 space-y-6"
      >
        {daysWithEvents.map((day) => {
          const dayEvents = getEventsForDay(day);
          return (
            <section
              key={day.toISOString()}
              ref={(el) => registerSection(day, el)}
              data-date={day.toISOString()}
              className="space-y-2"
            >
              <h3 className="py-1 text-sm font-semibold text-muted-foreground">
                {format(day, "EEEE, MMMM d")}
              </h3>
              {dayEvents.map((event) => (
                <CalendarEventListItem
                  key={event.instanceKey ?? event.id}
                  event={event}
                  onClick={() => onEventClick(event)}
                />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
