import { prisma } from "./prisma";
import { generateRecurrenceInstances } from "./recurrence";

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

function overlaps(
  userStart: Date,
  userEnd: Date,
  eventStart: Date,
  eventEnd: Date
): boolean {
  return userStart < eventEnd && userEnd > eventStart;
}

export async function checkEventConflicts(
  startTime: Date,
  endTime: Date,
  city?: string,
  venue?: string,
  excludeEventId?: string
): Promise<ConflictCheckResult> {
  const eventsInCity = await prisma.event.findMany({
    where: {
      id: excludeEventId ? { not: excludeEventId } : undefined,
      status: "APPROVED",
      ...(city?.trim()
        ? { city: { equals: city.trim(), mode: "insensitive" as const } }
        : {}),
    },
    include: {
      organizer: {
        select: { name: true },
      },
      recurrenceRule: true,
    },
    orderBy: { startTime: "asc" },
  });

  const conflicts: ConflictingEvent[] = [];

  for (const event of eventsInCity) {
    const baseEvent = {
      id: event.id,
      title: event.title,
      venue: event.venue,
      city: event.city,
      danceStyles: event.danceStyles,
      organizerName: event.organizer.name || "Unknown",
    };

    if (!event.isRecurring || !event.recurrenceRule) {
      if (overlaps(startTime, endTime, event.startTime, event.endTime)) {
        conflicts.push({
          ...baseEvent,
          startTime: event.startTime,
          endTime: event.endTime,
        });
      }
      continue;
    }

    const config = {
      frequency: event.recurrenceRule.frequency,
      interval: event.recurrenceRule.interval,
      daysOfWeek: event.recurrenceRule.daysOfWeek,
      until: event.recurrenceRule.until ?? undefined,
      count: event.recurrenceRule.count ?? undefined,
    };

    const instances = generateRecurrenceInstances(
      event.startTime,
      event.endTime,
      config
    );

    const overlappingInstance = instances.find((inst) =>
      overlaps(startTime, endTime, inst.startTime, inst.endTime)
    );

    if (overlappingInstance) {
      conflicts.push({
        ...baseEvent,
        startTime: overlappingInstance.startTime,
        endTime: overlappingInstance.endTime,
      });
    }
  }

  if (conflicts.length === 0) {
    return {
      hasConflicts: false,
      conflicts: [],
      conflictType: null,
      severity: null,
    };
  }

  const sameVenueConflicts = venue
    ? conflicts.filter(
        (c) => c.venue.toLowerCase() === venue.toLowerCase()
      )
    : [];

  const directTimeConflicts = conflicts.filter((c) =>
    overlaps(startTime, endTime, c.startTime, c.endTime)
  );

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

export function getConflictMessage(
  result: ConflictCheckResult,
  cityFiltered?: boolean
): string {
  if (!result.hasConflicts) {
    return "";
  }

  const count = result.conflicts.length;
  const eventWord = count === 1 ? "event" : "events";

  switch (result.conflictType) {
    case "venue":
      return `Warning: There ${count === 1 ? "is" : "are"} ${count} ${eventWord} at the same venue during this time.`;
    case "time":
      return cityFiltered
        ? `Note: There ${count === 1 ? "is" : "are"} ${count} ${eventWord} in the same city with overlapping times.`
        : `Warning: There ${count === 1 ? "is" : "are"} ${count} ${eventWord} at this date and time.`;
    case "city":
      return `Info: There ${count === 1 ? "is" : "are"} ${count} other ${eventWord} in ${result.conflicts[0]?.city || "this city"} around this time.`;
    default:
      return "";
  }
}
