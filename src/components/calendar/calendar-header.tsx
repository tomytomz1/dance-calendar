"use client";

import { endOfWeek, format, isSameMonth, isSameYear, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
  currentDate: Date;
  view: "week" | "month";
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: "week" | "month") => void;
}

function weekRangeLabel(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  if (isSameMonth(start, end)) return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
  if (isSameYear(start, end)) return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

export function CalendarHeader({ currentDate, view, onPrevious, onNext, onToday, onViewChange }: CalendarHeaderProps) {
  return (
    <div className="relative z-20 flex flex-col gap-4 border-b border-[#654C66] bg-[#211728] px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#FFF1E5] sm:text-3xl" aria-live="polite">
          {view === "month" ? format(currentDate, "MMMM yyyy") : weekRangeLabel(currentDate)}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label={view === "month" ? "Previous month" : "Previous week"} onClick={onPrevious} className="h-11 w-11 rounded-xl border-[#875D7D] bg-[#1A1422]"><ChevronLeft size={19}/></Button>
          <Button variant="outline" size="sm" onClick={onToday} className="h-11 rounded-xl border-[#875D7D] px-4">Today</Button>
          <Button variant="outline" size="icon" aria-label={view === "month" ? "Next month" : "Next week"} onClick={onNext} className="h-11 w-11 rounded-xl border-[#875D7D] bg-[#1A1422]"><ChevronRight size={19}/></Button>
        </div>
      </div>
      <div className="flex max-w-xs gap-2" role="group" aria-label="Calendar view">
        <Button variant={view === "month" ? "default" : "outline"} size="sm" aria-pressed={view === "month"} onClick={() => onViewChange("month")} className="h-10 flex-1 rounded-full">Month</Button>
        <Button variant={view === "week" ? "default" : "outline"} size="sm" aria-pressed={view === "week"} onClick={() => onViewChange("week")} className="h-10 flex-1 rounded-full">Week</Button>
      </div>
    </div>
  );
}
