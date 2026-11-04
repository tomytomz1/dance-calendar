import { describe, expect, it } from "vitest";
import { normalizeCityName } from "@/lib/city-name";
import { citySlug, deriveCitiesFromEvents } from "@/lib/seo";

describe("normalizeCityName", () => {
  it.each([
    ["Troy", "Troy"],
    ["Troy ", "Troy"],
    ["Ann Arbor ", "Ann Arbor"],
    ["Troy, MI 48083", "Troy"],
    ["Royal Oak, MI 48067", "Royal Oak"],
    ["Ferndale, MI", "Ferndale"],
    ["Detroit, Michigan", "Detroit"],
    ["Grand  Rapids", "Grand Rapids"],
    ["Mio", "Mio"],
    ["Midland", "Midland"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeCityName(input)).toBe(expected);
  });

  it("merges variants into one city slug", () => {
    expect(citySlug("Troy, MI 48083")).toBe("troy");
    expect(citySlug("Ferndale, MI")).toBe("ferndale");
    expect(
      deriveCitiesFromEvents([{ city: "Troy" }, { city: "Troy, MI 48083" }, { city: "Troy " }])
    ).toEqual(["Troy"]);
  });
});
