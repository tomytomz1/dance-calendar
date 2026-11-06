import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { generateRecurrenceInstances } from "@/lib/recurrence";
import {
  formatInSiteTimeZone,
  pinProcessTimeZone,
  toSiteWallClock,
} from "@/lib/timezone";

const iso = (d: Date) => d.toISOString();

describe("recurrence expansion in Michigan time", () => {
  const originalTz = process.env.TZ;
  beforeAll(() => pinProcessTimeZone());
  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it("keeps a 3rd-Friday evening social on Friday (not Thursday in UTC)", () => {
    // Fri Sep 18 2026, 8:15 PM EDT — stored as 00:15Z on Sep 19
    const start = new Date("2026-09-19T00:15:00.000Z");
    const end = new Date("2026-09-19T05:00:00.000Z");
    const instances = generateRecurrenceInstances(start, end, {
      frequency: "MONTHLY",
      interval: 1,
      monthlyPattern: "BY_WEEKDAY",
      monthlyDayOfWeek: 5,
      monthlyWeeks: [3],
    });
    const nov = instances.find((i) => i.startTime.getUTCMonth() === 10)!;
    // Fri Nov 20 2026, 8:15 PM EST
    expect(iso(nov.startTime)).toBe("2026-11-21T01:15:00.000Z");
    expect(formatInSiteTimeZone(nov.startTime, "EEEE h:mm a")).toBe("Friday 8:15 PM");
  });

  it("keeps the wall-clock start time across the DST change", () => {
    // Last Sunday, 5:30 PM EDT (Mar 29 2026)
    const start = new Date("2026-03-29T21:30:00.000Z");
    const end = new Date("2026-03-30T02:00:00.000Z");
    const instances = generateRecurrenceInstances(start, end, {
      frequency: "MONTHLY",
      interval: 1,
      monthlyPattern: "BY_WEEKDAY",
      monthlyDayOfWeek: 0,
      monthlyWeeks: [-1],
    });
    const nov = instances.find((i) => iso(i.startTime).startsWith("2026-11-29"))!;
    // Sun Nov 29 2026, 5:30 PM EST
    expect(iso(nov.startTime)).toBe("2026-11-29T22:30:00.000Z");
  });

  it("puts a last-Saturday 9 PM event on Saturday", () => {
    const start = new Date("2026-05-31T01:00:00.000Z"); // Sat May 30, 9 PM EDT
    const end = new Date("2026-05-31T05:00:00.000Z");
    const instances = generateRecurrenceInstances(start, end, {
      frequency: "MONTHLY",
      interval: 1,
      monthlyPattern: "BY_WEEKDAY",
      monthlyDayOfWeek: 6,
      monthlyWeeks: [-1],
    });
    const nov = instances.find((i) => formatInSiteTimeZone(i.startTime, "yyyy-MM") === "2026-11")!;
    expect(formatInSiteTimeZone(nov.startTime, "EEE MMM d h:mm a")).toBe("Sat Nov 28 9:00 PM");
  });
});

describe("toSiteWallClock", () => {
  const originalTz = process.env.TZ;
  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it("is the identity when the runtime is already in Michigan time", () => {
    process.env.TZ = "America/Detroit";
    const d = new Date("2026-11-14T01:30:00.000Z");
    expect(toSiteWallClock(d).getTime()).toBe(d.getTime());
  });

  it("shows Michigan time when the runtime is UTC", () => {
    process.env.TZ = "UTC";
    const d = new Date("2026-11-14T01:30:00.000Z"); // Fri Nov 13, 8:30 PM EST
    expect(formatInSiteTimeZone(d, "EEE MMM d h:mm a")).toBe("Fri Nov 13 8:30 PM");
  });

  it("handles daylight saving time", () => {
    process.env.TZ = "Asia/Tokyo";
    expect(formatInSiteTimeZone("2026-07-11T00:30:00.000Z", "EEE MMM d h:mm a")).toBe(
      "Fri Jul 10 8:30 PM"
    );
  });
});

describe("open-ended series horizon", () => {
  const originalTz = process.env.TZ;
  beforeAll(() => pinProcessTimeZone());
  afterAll(() => {
    process.env.TZ = originalTz;
  });

  const weekly = {
    frequency: "WEEKLY" as const,
    interval: 1,
  };
  const start = new Date("2026-01-09T01:00:00.000Z"); // Thu Jan 8 2026, 8 PM EST
  const end = new Date("2026-01-09T04:00:00.000Z");

  it("stops 12 months after the first date without a horizon (legacy behaviour)", () => {
    const instances = generateRecurrenceInstances(start, end, weekly);
    expect(instances.at(-1)!.startTime.getTime()).toBeLessThan(new Date("2027-01-09").getTime());
  });

  it("keeps generating up to the horizon", () => {
    const instances = generateRecurrenceInstances(start, end, {
      ...weekly,
      horizon: new Date("2027-06-30T00:00:00.000Z"),
    });
    const last = instances.at(-1)!;
    expect(formatInSiteTimeZone(last.startTime, "yyyy-MM-dd EEE h:mm a")).toBe("2027-06-24 Thu 8:00 PM");
  });

  it("still honours until", () => {
    const instances = generateRecurrenceInstances(start, end, {
      ...weekly,
      until: new Date("2026-02-01T05:00:00.000Z"),
      horizon: new Date("2027-06-30T00:00:00.000Z"),
    });
    expect(instances).toHaveLength(4);
  });
});
