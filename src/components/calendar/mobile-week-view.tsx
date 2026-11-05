"use client";

import { Fragment, useRef, useMemo } from "react";
import { motion, AnimatePresence, PanInfo, useDragControls } from "framer-motion";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { indexCalendarEvents, calendarDayKey } from "@/lib/calendar-event-days";
import { isSiteToday } from "@/lib/timezone";
import { useScrollSync } from "@/hooks/use-scroll-sync";
import type { CalendarEvent } from "@/lib/types";
import { CalendarEventChip } from "./calendar-event-chip";
import { CalendarEventListItem } from "./calendar-event-list-item";
import { MobileAgendaEmpty } from "./mobile-agenda-empty";

interface MobileWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  direction: number;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSwipe: (direction: number) => void;
}

const SWIPE_THRESHOLD = 50;

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
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { registerSection, scrollToSection } = useScrollSync(
    scrollContainerRef,
    onDateSelect,
    weekStart.toISOString(),
    { viewType: "week", scrollRoot: "viewport" }
  );

  const eventDays = useMemo(() => indexCalendarEvents(events), [events]);
  const getEventsForDay = (date: Date) => eventDays.get(calendarDayKey(date)) ?? [];

  const handleDayClick = (day: Date) => {
    onDateSelect(day);
    if (getEventsForDay(day).length > 0) scrollToSection(day);
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

  const daysWithEvents = weekDays.filter((day) => getEventsForDay(day).length > 0);

  return (
    <div className="flex w-full max-w-full flex-col overflow-x-hidden">
      <div className="overflow-x-hidden">
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            data-testid="calendar-swipe-surface"
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
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="w-full shrink-0 overflow-x-hidden"
          >
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: "pan-y" }}
              className="grid shrink-0 grid-cols-7 bg-[#191421]"
            >
              {weekDays.map((day) => {
                const eventsForDay = getEventsForDay(day);
                const isCurrentDay = isSiteToday(day);
                const isSelected = isSameDay(day, currentDate);

                return (
                  <button
                    type="button"
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    aria-pressed={isSelected}
                    aria-label={
                      [format(day, "EEE d"), ...eventsForDay.slice(0, 2).map(event => event.title),
                        ...(eventsForDay.length > 2 ? [`+${eventsForDay.length - 2}`] : [])].join(" ") +
                      ", " + format(day, "EEEE, MMMM d, yyyy") +
                      (isCurrentDay ? ", today" : "") +
                      (eventsForDay.length
                        ? `, ${eventsForDay.length} ${eventsForDay.length === 1 ? "event" : "events"}`
                        : ", no events")
                    }
                    className={cn(
                      "flex min-h-[84px] min-w-0 flex-col items-center gap-1 border-b border-r border-[#6B5065]/50 px-0.5 pb-1.5 pt-2 transition-colors last:border-r-0",
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#FF8179]",
                      isSelected && "bg-[#F46157]/15 ring-1 ring-inset ring-[#F46157]",
                      "active:bg-[#2C2034]"
                    )}
                  >
                    <span className="text-[11px] font-semibold uppercase text-[#D9C8D8]">
                      {format(day, "EEE")}
                    </span>{" "}
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-[#FFF1E5]",
                        isSelected && "bg-[#F46157] font-extrabold text-[#160E18]",
                        isCurrentDay && !isSelected && "border border-[#FF8179] font-bold text-[#FF8179]"
                      )}
                    >
                      {format(day, "d")}
                    </span>{" "}
                    <div className="flex w-full min-w-0 flex-col gap-0.5">
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
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        ref={scrollContainerRef}
        className="touch-pan-y space-y-6 border-t border-[#70516B] bg-[#201828] px-4 pb-10 pt-3"
      >
        <p className="text-xs text-[#BFAEBD]">Swipe the week to change dates · Times are Michigan time</p>
        {daysWithEvents.length === 0 && (
          <MobileAgendaEmpty label="No dances listed this week." period="week" />
        )}
        {daysWithEvents.map((day) => {
          const dayEvents = getEventsForDay(day);
          return (
            <section
              key={day.toISOString()}
              ref={(el) => registerSection(day, el)}
              data-date={day.toISOString()}
              aria-label={format(day, "EEEE, MMMM d")}
              className="space-y-2"
            >
              <h3
                className={cn(
                  "scroll-mt-24 py-1 text-sm font-bold",
                  isSameDay(day, currentDate) ? "text-[#FF9A93]" : "text-[#D9C8D8]"
                )}
              >
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
