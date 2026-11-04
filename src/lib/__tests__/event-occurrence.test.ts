import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { resolveEventOccurrence } from "@/lib/event-detail";
import { formatInSiteTimeZone, pinProcessTimeZone } from "@/lib/timezone";

// 3rd-Saturday social, 9 PM – 2 AM Michigan time (first date Sat Apr 18 2026, EDT).
const event = {
  startTime: new Date("2026-04-19T01:00:00.000Z"),
  endTime: new Date("2026-04-19T06:00:00.000Z"),
  isRecurring: true,
  recurrenceRule: {
    frequency: "MONTHLY" as const,
    interval: 1,
    daysOfWeek: [],
    until: null,
    count: null,
    monthlyPattern: "BY_WEEKDAY" as const,
    monthlyDayOfWeek: 6,
    monthlyWeeks: [3],
  },
};
const now = new Date("2026-11-04T12:00:00.000Z");
const show = (d: Date) => formatInSiteTimeZone(d, "EEE MMM d h:mm a");

describe("resolveEventOccurrence", () => {
  const originalTz = process.env.TZ;
  beforeAll(() => pinProcessTimeZone());
  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it("shows the series' current time for a stale ?instance= link on the same day", () => {
    // Link generated while the event wrongly started at noon EST.
    const r = resolveEventOccurrence(event, "2026-11-21T17:00:00.000Z", now);
    expect(r.isSpecificInstance).toBe(true);
    expect(show(r.start)).toBe("Sat Nov 21 9:00 PM");
    expect(show(r.end)).toBe("Sun Nov 22 2:00 AM");
  });

  it("keeps the wall-clock time after the DST change (EST date)", () => {
    const r = resolveEventOccurrence(event, "2026-12-20T02:00:00.000Z", now);
    expect(show(r.start)).toBe("Sat Dec 19 9:00 PM");
  });

  it("falls back to the next occurrence when the requested day is not in the series", () => {
    const r = resolveEventOccurrence(event, "2026-11-25T02:00:00.000Z", now);
    expect(r.isSpecificInstance).toBe(false);
    expect(show(r.start)).toBe("Sat Nov 21 9:00 PM");
  });

  it("uses the next upcoming occurrence without ?instance=", () => {
    expect(show(resolveEventOccurrence(event, null, now).start)).toBe("Sat Nov 21 9:00 PM");
  });

  it("still honours ?instance= on a recurring event with no rule", () => {
    const r = resolveEventOccurrence({ ...event, recurrenceRule: null }, "2026-11-22T02:00:00.000Z", now);
    expect(r.start.toISOString()).toBe("2026-11-22T02:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-11-22T07:00:00.000Z");
  });
});
