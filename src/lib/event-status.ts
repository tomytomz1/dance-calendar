import type { EventStatus } from "@prisma/client";

/**
 * Events are published without admin review: verified organizers' events go
 * live as soon as they are created or edited. Organizer accounts still need
 * admin approval once (see `User.verified`), which is the spam gate.
 */
export const NEW_EVENT_STATUS: EventStatus = "APPROVED";

/**
 * Status to write when a non-admin organizer edits their own event.
 * Returns undefined to leave the stored status unchanged.
 *
 * - DRAFT / CANCELLED requested: honored (organizer unpublishes or cancels).
 * - APPROVED / PENDING_APPROVAL requested: published.
 * - Nothing requested: a still-pending event is published; anything else
 *   (live, draft, cancelled) keeps its status, so editing a cancelled event
 *   does not quietly bring it back.
 */
export function organizerEditStatus(
  requested: EventStatus | undefined,
  current: EventStatus
): EventStatus | undefined {
  if (requested === "DRAFT" || requested === "CANCELLED") return requested;
  if (requested === "APPROVED" || requested === "PENDING_APPROVAL") {
    return "APPROVED";
  }
  return current === "PENDING_APPROVAL" ? "APPROVED" : undefined;
}
