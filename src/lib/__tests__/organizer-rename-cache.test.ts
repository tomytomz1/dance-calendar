import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

import { invalidateOrganizerPublicPages } from "@/lib/public-event-cache";

describe("invalidateOrganizerPublicPages", () => {
  beforeEach(() => revalidatePath.mockClear());

  it("refreshes listings, hubs and every event page of the organizer", () => {
    invalidateOrganizerPublicPages([
      { id: "evt1", slug: "haitian-konpa-knight" },
      { id: "evt2", slug: null },
    ]);
    const calls = revalidatePath.mock.calls.map((c) => c.join(" "));
    for (const expected of [
      "/",
      "/calendar",
      "/events",
      "/events/city/[city] page",
      "/events/style/[style] page",
      "/event/evt1",
      "/event/haitian-konpa-knight",
      "/event/evt2",
    ]) {
      expect(calls).toContain(expected);
    }
  });
});
