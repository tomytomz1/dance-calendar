import { formatInSiteTimeZone } from "@/lib/timezone";

interface EventDateTimeDisplayProps {
  startTime: string;
  endTime: string;
  variant: "date" | "time";
}

/**
 * Event date or time range in Michigan time. Deterministic on server and
 * client, so it renders into the HTML (no hydration flash or mismatch).
 */
export function EventDateTimeDisplay({ startTime, endTime, variant }: EventDateTimeDisplayProps) {
  if (variant === "date") {
    return (
      <time dateTime={startTime}>{formatInSiteTimeZone(startTime, "EEEE, MMMM d, yyyy")}</time>
    );
  }
  return (
    <span>
      <time dateTime={startTime}>{formatInSiteTimeZone(startTime, "h:mm a")}</time>
      {" – "}
      <time dateTime={endTime}>{formatInSiteTimeZone(endTime, "h:mm a")}</time>
    </span>
  );
}
