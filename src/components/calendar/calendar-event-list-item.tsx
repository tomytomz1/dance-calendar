"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";
import { StyleBadge } from "@/components/events/style-badge";

interface CalendarEventListItemProps {
  event: CalendarEvent;
  onClick: () => void;
  compact?: boolean;
  className?: string;
}

export function CalendarEventListItem({
  event,
  onClick,
  compact = false,
  className,
}: CalendarEventListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border bg-background hover:bg-muted/50 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        compact ? "p-2.5 min-h-[44px]" : "p-3 min-h-[44px]",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium truncate text-sm">{event.title}</h4>
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            {format(new Date(event.start), "h:mm a")}
            {!compact && (
              <>
                {" "}
                – {format(new Date(event.end), "h:mm a")}
              </>
            )}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {event.venue}
          {event.city ? ` · ${event.city}` : ""}
        </p>
        {event.danceStyles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.danceStyles.map((style) => (
              <StyleBadge key={style} style={style} />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
