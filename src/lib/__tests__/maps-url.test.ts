import { describe, it, expect } from "vitest";
import { buildGoogleMapsUrl } from "@/lib/maps-url";

describe("buildGoogleMapsUrl", () => {
  it("uses lat/lng when provided", () => {
    const url = buildGoogleMapsUrl({
      address: "123 Main",
      city: "Detroit",
      latitude: 42.33,
      longitude: -83.04,
    });
    expect(url).toContain("42.33");
    expect(url).toContain("-83.04");
  });

  it("encodes address when no coordinates", () => {
    const url = buildGoogleMapsUrl({
      address: "3536 Rochester Rd",
      city: "Troy",
    });
    expect(url).toContain("google.com/maps");
    expect(url).toContain("Troy");
  });
});
