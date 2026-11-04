"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getPrimaryDanceStyle,
  getStyleChipClasses,
} from "@/lib/dance-style-colors";
import type { CalendarEvent } from "@/lib/types";

interface CalendarEventChipProps {
  event: CalendarEvent;
  variant: "month" | "week" | "month-compact";
  /** Omit for the compact (mobile) variant: the whole day cell is the tap target. */
  onClick?: (e: React.MouseEvent) => void;
}

export function CalendarEventChip({
  event,
  variant,
  onClick,
}: CalendarEventChipProps) {
  const [showPreview, setShowPreview] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chipRef = useRef<HTMLDivElement>(null);

  const primaryStyle = getPrimaryDanceStyle(event.danceStyles);
  const { chip: chipClasses } = getStyleChipClasses(primaryStyle);
  const start = new Date(event.start);
  // "8pm" on the hour, "8:30pm" otherwise — never round a start time away.
  const timeShort = format(start, start.getMinutes() ? "h:mma" : "ha").toLowerCase();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShowPreview(true), 400);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowPreview(false);
  };

  const previewContent = (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border bg-popover px-3 py-2 text-left shadow-md">
      <p className="font-medium text-sm">{event.title}</p>
      <p className="text-xs text-muted-foreground">
        {format(new Date(event.start), "h:mm a")} –{" "}
        {format(new Date(event.end), "h:mm a")}
      </p>
      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
        {event.venue}, {event.city}
      </p>
      {event.danceStyles.length > 0 && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {event.danceStyles.slice(0, 2).join(", ")}
        </p>
      )}
    </div>
  );

  const isMonth = variant === "month";
  const isCompact = variant === "month-compact";

  if (isCompact) {
    // Decorative on phones: a 16px chip is too small to tap reliably, so taps
    // fall through to the day cell, which selects the day and shows its agenda.
    return (
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none flex h-4 w-full min-w-0 max-w-full items-center overflow-hidden rounded-full px-1",
          chipClasses
        )}
      >
        <span className="block w-full truncate text-[10px] font-semibold leading-none">
          {event.title}
        </span>
      </div>
    );
  }

  const label = isMonth ? `${timeShort} ${event.title}` : event.title;

  return (
    <div
      ref={chipRef}
      className="relative min-w-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showPreview && previewContent}
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label}, ${format(new Date(event.start), "h:mm a")} at ${event.venue}`}
        className={cn(
          "cursor-pointer rounded-full text-left overflow-hidden transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#FFF1E5]",
          chipClasses,
          isMonth
            ? "flex min-h-[20px] w-full min-w-0 max-w-full items-center px-1.5 py-0.5"
            : "flex h-6 w-full items-center px-2"
        )}
      >
        <span className="truncate block w-full text-xs font-medium">
          {label}
        </span>
      </button>
    </div>
  );
}
