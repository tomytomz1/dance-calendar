import { describe, it, expect } from "vitest";
import { isDbConnectionError } from "@/lib/db-errors";

describe("isDbConnectionError", () => {
  it("detects P1001", () => {
    expect(isDbConnectionError({ code: "P1001" })).toBe(true);
  });

  it("detects unreachable message", () => {
    expect(
      isDbConnectionError(
        new Error("Can't reach database server at host:5432")
      )
    ).toBe(true);
  });

  it("detects pool timeout", () => {
    expect(
      isDbConnectionError(new Error("Timed out fetching a new connection"))
    ).toBe(true);
  });
});
