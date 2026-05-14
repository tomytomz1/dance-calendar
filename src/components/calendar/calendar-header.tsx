"use client";

import { format } from "date-fns";
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

export function CalendarHeader({
  currentDate,
  view,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-card border-b sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {format(currentDate, view === "month" ? "MMMM yyyy" : "MMM d, yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="h-10 px-3"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="h-10 w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant={view === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewChange("week")}
          className="flex-1 h-10"
        >
          Week
        </Button>
        <Button
          variant={view === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewChange("month")}
          className="flex-1 h-10"
        >
          Month
        </Button>
      </div>
    </div>
  );
}
