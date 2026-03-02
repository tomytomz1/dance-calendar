import { prisma } from "./prisma";

export interface ConflictingEvent {
  id: string;
  title: string;
  venue: string;
  city: string;
  startTime: Date;
  endTime: Date;
  danceStyles: string[];
  organizerName: string;
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: ConflictingEvent[];
  conflictType: "time" | "venue" | "city" | null;
  severity: "high" | "medium" | "low" | null;
}

export async function checkEventConflicts(
  startTime: Date,
  endTime: Date,
  city: string,
  venue?: string,
  excludeEventId?: string
): Promise<ConflictCheckResult> {
  const buffer = 60 * 60 * 1000; // 1 hour buffer
  const searchStart = new Date(startTime.getTime() - buffer);
  const searchEnd = new Date(endTime.getTime() + buffer);

  const overlappingEvents = await prisma.event.findMany({
    where: {
      id: excludeEventId ? { not: excludeEventId } : undefined,
      status: "APPROVED",
      city: { equals: city, mode: "insensitive" },
      OR: [
        {
          AND: [
            { startTime: { lte: searchEnd } },
            { endTime: { gte: searchStart } },
          ],
        },
      ],
    },
    include: {
      organizer: {
        select: { name: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  if (overlappingEvents.length === 0) {
    return {
      hasConflicts: false,
      conflicts: [],
      conflictType: null,
      severity: null,
    };
  }

  const conflicts: ConflictingEvent[] = overlappingEvents.map((event) => ({
    id: event.id,
    title: event.title,
    venue: event.venue,
    city: event.city,
    startTime: event.startTime,
    endTime: event.endTime,
    danceStyles: event.danceStyles,
    organizerName: event.organizer.name || "Unknown",
  }));

  const sameVenueConflicts = venue
    ? conflicts.filter(
        (c) => c.venue.toLowerCase() === venue.toLowerCase()
      )
    : [];

  const directTimeConflicts = conflicts.filter((c) => {
    const eventStart = new Date(c.startTime);
    const eventEnd = new Date(c.endTime);
    return startTime < eventEnd && endTime > eventStart;
  });

  let conflictType: "venue" | "time" | "city" | null = null;
  let severity: "high" | "medium" | "low" | null = null;

  if (sameVenueConflicts.length > 0) {
    conflictType = "venue";
    severity = "high";
  } else if (directTimeConflicts.length > 0) {
    conflictType = "time";
    severity = "medium";
  } else if (conflicts.length > 0) {
    conflictType = "city";
    severity = "low";
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    conflictType,
    severity,
  };
}

export function getConflictMessage(result: ConflictCheckResult): string {
  if (!result.hasConflicts) {
    return "";
  }

  const count = result.conflicts.length;
  const eventWord = count === 1 ? "event" : "events";

  switch (result.conflictType) {
    case "venue":
      return `Warning: There ${count === 1 ? "is" : "are"} ${count} ${eventWord} at the same venue during this time.`;
    case "time":
      return `Note: There ${count === 1 ? "is" : "are"} ${count} ${eventWord} in the same city with overlapping times.`;
    case "city":
      return `Info: There ${count === 1 ? "is" : "are"} ${count} other ${eventWord} in ${result.conflicts[0]?.city || "this city"} around this time.`;
    default:
      return "";
  }
}
