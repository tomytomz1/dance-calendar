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
  onClick: (e: React.MouseEvent) => void;
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
  const timeShort = format(new Date(event.start), "ha").toLowerCase();

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

  const label = isCompact
    ? event.title.length > 8
      ? `${event.title.slice(0, 7)}…`
      : event.title
    : isMonth
      ? `${timeShort} ${event.title}`
      : event.title;

  return (
    <div
      ref={chipRef}
      className="relative min-w-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showPreview && !isCompact && previewContent}
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            (e.target as HTMLElement).click();
          }
        }}
        title={`${event.title} – ${format(new Date(event.start), "h:mm a")} at ${event.venue}`}
        className={cn(
          "cursor-pointer rounded-full transition-colors text-left overflow-hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          chipClasses,
          isCompact
            ? "w-full min-w-0 max-w-full px-1 py-0.5 h-4 flex items-center"
            : isMonth
              ? "w-full min-w-0 max-w-full px-1.5 py-0.5 min-h-[20px] flex items-center"
              : "w-full h-6 px-2 flex items-center"
        )}
      >
        <span className="truncate block w-full text-xs font-medium">
          {label}
        </span>
      </div>
    </div>
  );
}
