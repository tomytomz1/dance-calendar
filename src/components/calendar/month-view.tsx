"use client";

import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import { isSiteToday } from "@/lib/timezone";
import { CalendarEventChip } from "./calendar-event-chip";
import { SelectedDayAgenda } from "./selected-day-agenda";
import type { CalendarEvent } from "@/lib/types";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  direction: number;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSwipe: (direction: number) => void;
}

export function MonthView({ currentDate, events, direction, onDateSelect, onEventClick, onSwipe }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays: Date[] = [];
  for (let d = calendarStart; d <= calendarEnd; d = addDays(d, 1)) calendarDays.push(d);
  const eventsForDay = (date: Date) => events.filter(event => isSameDay(new Date(event.start), date));
  const selectedDayEvents = eventsForDay(currentDate);
  const variants = {
    enter: (value: number) => ({ x: value > 0 ? "30%" : "-30%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (value: number) => ({ x: value < 0 ? "30%" : "-30%", opacity: 0 }),
  };
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 60) onSwipe(-1);
    else if (info.offset.x < -60) onSwipe(1);
  };

  return (
    <div className="min-h-[520px] w-full overflow-hidden touch-pan-y">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={monthStart.toISOString()}
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
          className="grid min-h-[520px] grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(270px,340px)]"
        >
          <div className="min-w-0 overflow-hidden rounded-2xl border border-[#755572] bg-[#181421]">
            <div className="grid grid-cols-7 border-b border-[#5E4B65] bg-[#211827]">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(weekday => (
                <div key={weekday} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#D9C8D8]">{weekday}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map(day => {
                const matchingEvents = eventsForDay(day);
                const currentMonth = isSameMonth(day, currentDate);
                const selected = isSameDay(day, currentDate);
                const today = isSiteToday(day);
                return (
                  <div key={day.toISOString()} onClick={() => onDateSelect(day)} className={cn(
                    "min-w-0 min-h-[76px] cursor-pointer border-b border-r border-[#6B5065]/60 p-1.5 transition-colors sm:min-h-[90px] md:p-2",
                    !currentMonth && "bg-[#12101C]/85",
                    selected && "bg-[#4C2B42]/65 ring-1 ring-inset ring-[#F46157]",
                    !selected && "hover:bg-[#291D30]"
                  )}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); onDateSelect(day); }}
                      aria-label={format(day, "EEEE, MMMM d, yyyy") + (today ? ", today" : "") + (matchingEvents.length ? ", " + matchingEvents.length + (matchingEvents.length === 1 ? " event" : " events") : "")}
                      aria-pressed={selected}
                      className={cn("mb-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#FF8179]",
                        !currentMonth && "text-[#88788D]",
                        selected && "bg-[#F46157] font-extrabold text-[#160E18]",
                        today && !selected && "border border-[#FF8179] text-[#FF8179]"
                      )}
                    >{format(day,"d")}</button>
                    <div className="flex min-w-0 flex-col gap-1">
                      {matchingEvents.slice(0,2).map(event => (
                        <CalendarEventChip
                          key={event.instanceKey ?? event.id}
                          event={event}
                          variant="month"
                          onClick={e => { e.stopPropagation(); onDateSelect(day); onEventClick(event); }}
                        />
                      ))}
                      {matchingEvents.length > 2 && <span className="truncate text-[11px] font-semibold text-[#E8D6EA]">+{matchingEvents.length - 2} more</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <SelectedDayAgenda date={currentDate} events={selectedDayEvents} onEventClick={onEventClick} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
