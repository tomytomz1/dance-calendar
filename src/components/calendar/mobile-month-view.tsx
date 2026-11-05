"use client";

import { Fragment, useRef, useMemo } from "react";
import * as m from "framer-motion/m";
import { AnimatePresence, PanInfo, useDragControls } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import { indexCalendarEvents, calendarDayKey } from "@/lib/calendar-event-days";
import { isSiteToday } from "@/lib/timezone";
import { useScrollSync } from "@/hooks/use-scroll-sync";
import type { CalendarEvent } from "@/lib/types";
import { CalendarEventChip } from "./calendar-event-chip";
import { CalendarEventListItem } from "./calendar-event-list-item";
import { MobileAgendaEmpty } from "./mobile-agenda-empty";

interface MobileMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  direction: number;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSwipe: (direction: number) => void;
}

const SWIPE_THRESHOLD = 50;

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
  for (let day = calendarStart; day <= calendarEnd; day = addDays(day, 1)) {
    calendarDays.push(day);
  }

  const { registerSection, scrollToSection } = useScrollSync(
    scrollContainerRef,
    onDateSelect,
    monthStart.toISOString(),
    { viewType: "month", scrollRoot: "viewport" }
  );

  const eventDays = useMemo(() => indexCalendarEvents(events), [events]);
  const getEventsForDay = (date: Date) => eventDays.get(calendarDayKey(date)) ?? [];

  const handleDayClick = (d: Date) => {
    onDateSelect(d);
    if (getEventsForDay(d).length > 0) scrollToSection(d);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) onSwipe(-1);
    else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe(1);
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? "100%" : "-100%", opacity: 0 }),
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Only this month's days go in the agenda (leading/trailing days belong to
  // the neighbouring months and would be filtered out by scroll sync anyway).
  const daysWithEvents = calendarDays.filter(
    (d) => isSameMonth(d, currentDate) && getEventsForDay(d).length > 0
  );

  return (
    <div className="flex w-full max-w-full flex-col overflow-x-hidden">
      <div className="overflow-x-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <m.div
            data-testid="calendar-swipe-surface"
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
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="w-full shrink-0 overflow-x-hidden"
          >
            {/* pan-y: vertical page scrolling keeps working over the grid; horizontal swipes change month */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: "pan-y" }}
              className="shrink-0"
            >
              <div className="grid grid-cols-7 border-b border-[#74526C] bg-[#22182A]" aria-hidden="true">
                {weekDays.map((d) => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-[#D9C8D8]">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid shrink-0 grid-cols-7 bg-[#191421]">
                {calendarDays.map((day) => {
                  const eventsForDay = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isSiteToday(day);
                  const isSelected = isSameDay(day, currentDate);

                  return (
                    <button
                      type="button"
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      aria-pressed={isSelected}
                      aria-label={
                        [format(day, "d"), ...eventsForDay.slice(0, 2).map(event => event.title),
                          ...(eventsForDay.length > 2 ? [`+${eventsForDay.length - 2}`] : [])].join(" ") +
                        ", " + format(day, "EEEE, MMMM d, yyyy") +
                        (isCurrentDay ? ", today" : "") +
                        (eventsForDay.length
                          ? `, ${eventsForDay.length} ${eventsForDay.length === 1 ? "event" : "events"}`
                          : ", no events")
                      }
                      className={cn(
                        "flex min-h-[52px] min-w-0 flex-col items-center justify-start border-b border-r border-[#6B5065]/50 p-1 transition-colors [&:nth-child(7n)]:border-r-0",
                        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#FF8179]",
                        !isCurrentMonth && "bg-[#14121D]",
                        isSelected && "bg-[#F46157]/15 ring-1 ring-inset ring-[#F46157]",
                        "active:bg-[#2C2034]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-sm text-[#FFF1E5]",
                          !isCurrentMonth && "text-[#88788D]",
                          isSelected && "bg-[#F46157] font-extrabold text-[#160E18]",
                          isCurrentDay && !isSelected && "border border-[#FF8179] font-bold text-[#FF8179]"
                        )}
                      >
                        {format(day, "d")}
                      </span>{" "}
                      <div className="mt-0.5 flex w-full min-w-0 flex-col gap-0.5 px-0.5">
                        {eventsForDay.slice(0, 2).map((event) => (
                          <Fragment key={event.instanceKey ?? event.id}>
                            <CalendarEventChip event={event} variant="month-compact" />{" "}
                          </Fragment>
                        ))}
                        {eventsForDay.length > 2 && (
                          <span className="text-center text-[10px] font-semibold text-[#E8D6EA]">
                            +{eventsForDay.length - 2}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </m.div>
        </AnimatePresence>
      </div>

      <div
        ref={scrollContainerRef}
        className="touch-pan-y space-y-6 border-t border-[#70516B] bg-[#201828] px-4 pb-10 pt-3"
      >
        <p className="text-xs text-[#BFAEBD]">Swipe the calendar to change month · Times are Michigan time</p>
        {daysWithEvents.length === 0 && (
          <MobileAgendaEmpty label={`No dances listed in ${format(currentDate, "MMMM")} yet.`} />
        )}
        {daysWithEvents.map((d) => {
          const dayEvents = getEventsForDay(d);
          return (
            <section
              key={d.toISOString()}
              ref={(el) => registerSection(d, el)}
              data-date={d.toISOString()}
              aria-label={format(d, "EEEE, MMMM d")}
              className="space-y-2"
            >
              <h3
                className={cn(
                  "scroll-mt-24 py-1 text-sm font-bold",
                  isSameDay(d, currentDate) ? "text-[#FF9A93]" : "text-[#D9C8D8]"
                )}
              >
                {format(d, "EEEE, MMMM d")}
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
