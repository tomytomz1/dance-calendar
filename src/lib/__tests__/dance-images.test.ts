import { describe, expect, it } from "vitest";
import { danceImageForStyles, organizerImageUrl } from "@/lib/dance-images";

describe("organizerImageUrl", () => {
  it("rejects Facebook page and share links that are not images", () => {
    expect(organizerImageUrl("https://www.facebook.com/profile.php?id=61586929481648")).toBeNull();
    expect(organizerImageUrl("https://www.facebook.com/share/1GJ8y7bh6t/?mibextid=wwXIfr")).toBeNull();
    expect(organizerImageUrl("https://facebook.com/events/s/bachata-night/123")).toBeNull();
  });

  it("accepts image files and known image CDNs", () => {
    expect(organizerImageUrl("https://example.com/flyer.JPG")).toBe("https://example.com/flyer.JPG");
    expect(
      organizerImageUrl("https://scontent-det1-1.xx.fbcdn.net/v/t39.30808-6/648295761_n.jpg?_nc_cat=103")
    ).toContain("fbcdn.net");
  });

  it("drops expired signed Facebook CDN links", () => {
    const base = "https://scontent-det1-1.xx.fbcdn.net/v/t39.30808-6/1_n.jpg?_nc_cat=103&oh=00_abc";
    const now = Date.parse("2026-11-04T00:00:00Z");
    const expired = (Date.parse("2026-04-05T00:00:00Z") / 1000).toString(16);
    const valid = (Date.parse("2026-12-01T00:00:00Z") / 1000).toString(16);
    expect(organizerImageUrl(`${base}&oe=${expired}`, now)).toBeNull();
    expect(organizerImageUrl(`${base}&oe=${valid}`, now)).toContain("fbcdn.net");
  });

  it("rejects non-http values", () => {
    expect(organizerImageUrl("javascript:alert(1)")).toBeNull();
    expect(organizerImageUrl("not a url")).toBeNull();
    expect(organizerImageUrl(null)).toBeNull();
  });
});

describe("danceImageForStyles", () => {
  it("picks the first style with art and falls back to the class photo", () => {
    expect(danceImageForStyles(["Other", "Bachata"])).toBe("/dance/event-bachata.webp");
    expect(danceImageForStyles(["Zouk"])).toBe("/dance/event-beginner-class.webp");
  });

  it("varies the art when told which images are already used", () => {
    const used = new Set(["/dance/event-salsa.webp"]);
    expect(danceImageForStyles(["Salsa", "Bachata"], used)).toBe("/dance/event-bachata.webp");
    used.add("/dance/event-bachata.webp");
    expect(danceImageForStyles(["Salsa", "Bachata"], used)).toBe("/dance/event-beginner-class.webp");
  });
});
