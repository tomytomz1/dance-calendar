import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Sensual Rhythms Bachata")).toBe("sensual-rhythms-bachata");
  });

  it("strips quotes", () => {
    expect(slugify("Joe's Night")).toBe("joes-night");
  });
});
