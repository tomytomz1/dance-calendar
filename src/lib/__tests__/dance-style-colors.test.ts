import { describe, it, expect } from "vitest";
import {
  getStyleChipClasses,
  getPrimaryDanceStyle,
} from "@/lib/dance-style-colors";

describe("getStyleChipClasses", () => {
  it("returns stable classes for known styles", () => {
    const salsa = getStyleChipClasses("Salsa");
    expect(salsa.chip).toContain("rose");
    expect(salsa.badge).toContain("rose");
  });

  it("returns Other mapping for empty primary", () => {
    expect(getPrimaryDanceStyle([])).toBe("Other");
  });

  it("returns fallback for unknown custom style", () => {
    const a = getStyleChipClasses("Custom Fusion");
    const b = getStyleChipClasses("Custom Fusion");
    expect(a.chip).toBe(b.chip);
    expect(a.chip.length).toBeGreaterThan(0);
  });
});
