import { format, isSameDay } from "date-fns";

/**
 * Every listed event happens in Michigan, so times are always shown in
 * Michigan time — regardless of where the server (UTC on Vercel) or the
 * visitor's browser is.
 */
export const SITE_TIME_ZONE = "America/Detroit";

let partsFormatter: Intl.DateTimeFormat | null = null;

function getPartsFormatter(): Intl.DateTimeFormat {
  if (!partsFormatter) {
    partsFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: SITE_TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  return partsFormatter;
}

/**
 * Returns a Date whose *local* calendar fields (year, month, day, hours…)
 * equal the Michigan wall-clock time of `value`. date-fns helpers that read
 * local fields (format, isSameDay, startOfMonth…) then behave as if the
 * runtime were in Michigan. In a runtime already set to Michigan time this
 * is the identity.
 *
 * Use only for display and day bucketing; never persist or serialize the
 * result as an instant.
 */
export function toSiteWallClock(value: Date | string | number): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return date;
  const parts: Record<string, number> = {};
  for (const part of getPartsFormatter().formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    date.getMilliseconds()
  );
}

/** date-fns `format` evaluated in Michigan time. */
export function formatInSiteTimeZone(
  value: Date | string | number,
  pattern: string
): string {
  return format(toSiteWallClock(value), pattern);
}

/** "Now" as a Michigan wall-clock Date (see toSiteWallClock). */
export function siteNow(): Date {
  return toSiteWallClock(new Date());
}

/** True when a wall-clock day (from toSiteWallClock) is today in Michigan. */
export function isSiteToday(wallClockDay: Date): boolean {
  return isSameDay(wallClockDay, siteNow());
}

/**
 * Pins the Node.js process to Michigan time so server-side date math that
 * reads local fields (recurrence expansion, "tomorrow" email windows, date
 * formatting) matches what organizers entered. Vercel functions run in UTC
 * and do not allow overriding TZ through project settings.
 */
export function pinProcessTimeZone(): void {
  if (typeof process === "undefined" || !process.env) return;
  if (process.env.TZ !== SITE_TIME_ZONE) {
    process.env.TZ = SITE_TIME_ZONE;
  }
}
