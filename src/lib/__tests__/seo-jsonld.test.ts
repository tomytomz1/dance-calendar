import { describe, it, expect } from "vitest";
import { buildEventJsonLd } from "@/lib/seo";

describe("buildEventJsonLd", () => {
  it("returns Event schema with location", () => {
    const json = buildEventJsonLd({
      id: "1",
      slug: "test-event",
      title: "Test Social",
      description: "A fun night",
      venue: "Studio",
      address: "1 Main St",
      city: "Detroit",
      danceStyles: ["Salsa"],
      startTime: new Date("2026-06-01T20:00:00Z"),
      endTime: new Date("2026-06-01T23:00:00Z"),
      imageUrl: null,
      ticketUrl: null,
      price: "$10",
      status: "APPROVED",
      updatedAt: new Date(),
      organizer: { name: "Host" },
    });

    expect(json["@type"]).toBe("Event");
    expect(json.name).toBe("Test Social");
    expect((json.location as { address: { addressLocality: string } }).address
      .addressLocality).toBe("Detroit");
  });
});
