"use client";

import { format } from "date-fns";

interface EventDateTimeDisplayProps {
  startTime: string;
  endTime: string;
  variant: "date" | "time";
}

export function EventDateTimeDisplay({
  startTime,
  endTime,
  variant,
}: EventDateTimeDisplayProps) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (variant === "date") {
    return (
      <span suppressHydrationWarning>
        {format(start, "EEEE, MMMM d, yyyy")}
      </span>
    );
  }

  return (
    <span suppressHydrationWarning>
      {format(start, "h:mm a")} - {format(end, "h:mm a")}
    </span>
  );
}
