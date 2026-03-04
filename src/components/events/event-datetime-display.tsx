"use client";

import { useState, useEffect } from "react";
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
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (variant === "date") {
      setFormatted(format(start, "EEEE, MMMM d, yyyy"));
    } else {
      setFormatted(`${format(start, "h:mm a")} - ${format(end, "h:mm a")}`);
    }
  }, [startTime, endTime, variant]);

  return (
    <span suppressHydrationWarning>
      {formatted ?? "\u00A0"}
    </span>
  );
}
