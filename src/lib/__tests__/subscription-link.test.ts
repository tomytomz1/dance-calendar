import { describe, it, expect } from "vitest";
import { dedupeSubscribersByEmail } from "@/lib/subscription-link";

describe("dedupeSubscribersByEmail", () => {
  it("keeps one row per canonical email", () => {
    const subs = [
      { email: "A@Example.com", id: "1" },
      { email: "a@example.com", id: "2" },
      { email: "b@test.com", id: "3" },
    ];
    const result = dedupeSubscribersByEmail(subs);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].email).toBe("b@test.com");
  });
});
