"use client";

import { useMemo } from "react";

import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { indexCalendarEvents, calendarDayKey } from "@/lib/calendar-event-days";
import { isSiteToday } from "@/lib/timezone";
import { CalendarEventChip } from "./calendar-event-chip";
import { SelectedDayAgenda } from "./selected-day-agenda";
import type { CalendarEvent } from "@/lib/types";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  direction: number;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSwipe: (direction: number) => void;
}

const MAX_CHIPS = 4;

export function WeekView({
  currentDate,
  events,
  direction,
  onDateSelect,
  onEventClick,
  onSwipe,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 60) onSwipe(-1);
    else if (info.offset.x < -60) onSwipe(1);
  };

  const eventDays = useMemo(() => indexCalendarEvents(events), [events]);
  const getEventsForDay = (date: Date) => eventDays.get(calendarDayKey(date)) ?? [];

  const variants = {
    enter: (value: number) => ({ x: value > 0 ? "30%" : "-30%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (value: number) => ({ x: value < 0 ? "30%" : "-30%", opacity: 0 }),
  };

  return (
    <div className="min-h-[420px] w-full overflow-hidden touch-pan-y">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={weekStart.toISOString()}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={handleDragEnd}
          className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(270px,340px)]"
        >
          <div className="min-w-0 overflow-hidden rounded-2xl border border-[#755572] bg-[#181421]">
            <div className="grid grid-cols-7">
              {weekDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const today = isSiteToday(day);
                const selected = isSameDay(day, currentDate);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex min-h-[260px] min-w-0 flex-col border-r border-[#6B5065]/60 last:border-r-0 transition-colors",
                      selected ? "bg-[#4C2B42]/65 ring-1 ring-inset ring-[#F46157]" : "hover:bg-[#291D30]"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onDateSelect(day)}
                      aria-pressed={selected}
                      aria-label={
                        format(day, "EEE d") + ", " + format(day, "EEEE, MMMM d, yyyy") +
                        (today ? ", today" : "") +
                        (dayEvents.length
                          ? `, ${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}`
                          : "")
                      }
                      className="flex flex-col items-center gap-1 border-b border-[#5E4B65] bg-[#211827] px-1 py-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#FF8179]"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#D9C8D8]">
                        {format(day, "EEE")}
                      </span>{" "}
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-base font-bold text-[#FFF1E5]",
                          selected && "bg-[#F46157] font-extrabold text-[#160E18]",
                          today && !selected && "border border-[#FF8179] text-[#FF8179]"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </button>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-1.5 md:p-2">
                      {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                        <CalendarEventChip
                          key={event.instanceKey ?? event.id}
                          event={event}
                          variant="month"
                          onClick={() => {
                            onDateSelect(day);
                            onEventClick(event);
                          }}
                        />
                      ))}
                      {dayEvents.length > MAX_CHIPS && (
                        <button
                          type="button"
                          onClick={() => onDateSelect(day)}
                          className="truncate text-left text-[11px] font-semibold text-[#E8D6EA] hover:text-[#FF9A93]"
                        >
                          +{dayEvents.length - MAX_CHIPS} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <SelectedDayAgenda
            date={currentDate}
            events={getEventsForDay(currentDate)}
            onEventClick={onEventClick}
            allEvents={events}
            onDateSelect={onDateSelect}
            emptyHint="Pick another day this week, or use the arrows to see the next week."
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
