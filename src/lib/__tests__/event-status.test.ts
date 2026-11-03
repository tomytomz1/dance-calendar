import { describe, expect, it } from "vitest";
import { NEW_EVENT_STATUS, organizerEditStatus } from "../event-status";

describe("event auto-approval", () => {
  it("publishes new events immediately", () => {
    expect(NEW_EVENT_STATUS).toBe("APPROVED");
  });

  it("keeps a live event live when edited", () => {
    expect(organizerEditStatus(undefined, "APPROVED")).toBeUndefined();
  });

  it("publishes an event still pending from before auto-approval", () => {
    expect(organizerEditStatus(undefined, "PENDING_APPROVAL")).toBe("APPROVED");
  });

  it("does not revive a cancelled or draft event on a plain edit", () => {
    expect(organizerEditStatus(undefined, "CANCELLED")).toBeUndefined();
    expect(organizerEditStatus(undefined, "DRAFT")).toBeUndefined();
  });

  it("honors an organizer cancelling or unpublishing", () => {
    expect(organizerEditStatus("CANCELLED", "APPROVED")).toBe("CANCELLED");
    expect(organizerEditStatus("DRAFT", "APPROVED")).toBe("DRAFT");
  });

  it("treats a requested pending or approved status as published", () => {
    expect(organizerEditStatus("PENDING_APPROVAL", "DRAFT")).toBe("APPROVED");
    expect(organizerEditStatus("APPROVED", "CANCELLED")).toBe("APPROVED");
  });
});
