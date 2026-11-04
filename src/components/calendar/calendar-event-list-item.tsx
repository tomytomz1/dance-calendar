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
        "w-full rounded-xl border border-[#694E65] bg-[#1C1623] text-left transition-colors hover:border-[#F46157] hover:bg-[#291D30]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8179]",
        compact ? "p-2.5 min-h-[44px]" : "p-3 min-h-[44px]",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="min-w-0 truncate text-sm font-bold text-[#FFF1E5]">{event.title}</h4>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-[#FF9A93]">
            {format(new Date(event.start), "h:mm a")}
            {!compact && (
              <>
                {" "}
                – {format(new Date(event.end), "h:mm a")}
              </>
            )}
          </span>
        </div>
        <p className="text-xs text-[#D2C0D0]">
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
