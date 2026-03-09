"use client";

import { useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarEventChip } from "./calendar-event-chip";
import type { CalendarEvent } from "@/lib/types";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  direction: number;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSwipe: (direction: number) => void;
}

export function WeekView({
  currentDate,
  events,
  direction,
  onDateSelect,
  onEventClick,
  onSwipe,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

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

  return (
    <div className="flex-1 overflow-hidden touch-pan-y">
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
          className="h-full"
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

          <div className="grid grid-cols-7 min-h-[100px]">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentDay = isToday(day);
              const isSelected = isSameDay(day, currentDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateSelect(day)}
                  className={cn(
                    "flex flex-col items-center p-2 border-r border-b last:border-r-0 min-h-[80px] transition-colors",
                    isSelected && "bg-primary/5",
                    "hover:bg-muted/50 active:bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium mb-1",
                      isCurrentDay && "bg-primary text-primary-foreground",
                      isSelected && !isCurrentDay && "bg-secondary"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-col gap-0.5 w-full">
                    {dayEvents.slice(0, 3).map((event) => (
                      <CalendarEventChip
                        key={event.instanceKey ?? event.id}
                        event={event}
                        variant="week"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-350px)]">
            <h3 className="font-semibold text-sm text-muted-foreground">
              {format(currentDate, "EEEE, MMMM d")}
            </h3>
            {getEventsForDay(currentDate).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No events scheduled
              </p>
            ) : (
              getEventsForDay(currentDate).map((event) => (
                <button
                  key={event.instanceKey ?? event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.start), "h:mm a")} -{" "}
                        {format(new Date(event.end), "h:mm a")}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {event.venue}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
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
