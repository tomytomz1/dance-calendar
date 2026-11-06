import { describe, expect, it } from "vitest";
import { excludeExistingInstances } from "@/lib/recurrence";

const occ = (iso: string, hours = 5) => {
  const startTime = new Date(iso);
  return { startTime, endTime: new Date(startTime.getTime() + hours * 3600_000) };
};

describe("excludeExistingInstances", () => {
  it("skips occurrences that are already stored, so cron re-runs add nothing", () => {
    const generated = [
      occ("2026-11-22T02:00:00.000Z"),
      occ("2026-12-20T02:00:00.000Z"),
    ];
    const stored = [new Date("2026-11-22T02:00:00.000Z")];
    const result = excludeExistingInstances(generated, stored);
    expect(result.map((i) => i.startTime.toISOString())).toEqual([
      "2026-12-20T02:00:00.000Z",
    ]);
    // Second run after inserting: nothing new.
    expect(
      excludeExistingInstances(generated, [...stored, result[0].startTime])
    ).toEqual([]);
  });

  it("removes repeats inside one generated batch", () => {
    const generated = [occ("2026-11-22T02:00:00.000Z"), occ("2026-11-22T02:00:00.000Z")];
    expect(excludeExistingInstances(generated, [])).toHaveLength(1);
  });

  it("keeps everything when nothing is stored", () => {
    const generated = [occ("2026-11-22T02:00:00.000Z"), occ("2026-12-20T02:00:00.000Z")];
    expect(excludeExistingInstances(generated, [])).toHaveLength(2);
  });
});
