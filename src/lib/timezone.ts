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

/** Convert date-picker fields in Michigan to an instant, independent of browser TZ.
 * Reject DST gaps instead of silently moving an organizer's event an hour.
 * On the repeated autumn hour choose the earlier matching instant explicitly.
 */
export function fromSiteWallClock(day: Date, time: string = "00:00"): Date {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!Number.isFinite(+day) || !match || +match[1] > 23 || +match[2] > 59) {
    throw new RangeError("Choose a valid Michigan date and time.");
  }
  const fields = [day.getFullYear(), day.getMonth(), day.getDate(), +match[1], +match[2]];
  const wall = Date.UTC(fields[0], fields[1], fields[2], fields[3], fields[4]);
  // Detroit uses UTC-4 or UTC-5. Compare formatted fields, never browser offsets.
  for (const offset of [4, 5]) {
    const instant = new Date(wall + offset * 3600000);
    const parts = Object.fromEntries(getPartsFormatter().formatToParts(instant)
      .filter((p) => p.type !== "literal").map((p) => [p.type, Number(p.value)]));
    if (parts.year === fields[0] && parts.month === fields[1] + 1 &&
        parts.day === fields[2] && parts.hour === fields[3] && parts.minute === fields[4]) return instant;
  }
  throw new RangeError("This Michigan time does not exist because clocks move forward. Choose another time.");
}
