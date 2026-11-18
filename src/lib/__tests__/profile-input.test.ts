import { describe, expect, it } from "vitest";
import { normalizeWebsite, validateProfileInput } from "@/lib/profile-input";

describe("normalizeWebsite", () => {
  it("adds https:// when the scheme is missing", () => {
    expect(normalizeWebsite("madancelab.com")).toBe("https://madancelab.com");
    expect(normalizeWebsite("  www.madancelab.com/clases ")).toBe(
      "https://www.madancelab.com/clases"
    );
  });
  it("keeps existing http(s) URLs and empty input", () => {
    expect(normalizeWebsite("http://a.com")).toBe("http://a.com");
    expect(normalizeWebsite("https://a.com")).toBe("https://a.com");
    expect(normalizeWebsite("")).toBe("");
    expect(normalizeWebsite(null)).toBe("");
  });
  it("does not rewrite other schemes (so they are still rejected)", () => {
    expect(normalizeWebsite("javascript:alert(1)")).toBe("javascript:alert(1)");
  });
});

describe("validateProfileInput", () => {
  const ok = { name: "MA Dance Lab", bio: "", phone: "", website: "" };
  it("accepts a valid profile and a bare domain", () => {
    expect(validateProfileInput(ok)).toEqual({});
    expect(validateProfileInput({ ...ok, website: "madancelab.com" })).toEqual({});
  });
  it("flags each bad field separately", () => {
    const errors = validateProfileInput({
      name: "M",
      bio: "x".repeat(501),
      phone: "1".repeat(21),
      website: "not a site",
    });
    expect(Object.keys(errors).sort()).toEqual(["bio", "name", "phone", "website"]);
  });
  it("rejects non-http schemes", () => {
    expect(validateProfileInput({ ...ok, website: "javascript:alert(1)" }).website).toBeTruthy();
  });
});
