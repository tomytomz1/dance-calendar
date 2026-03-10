/**
 * Debug script to inspect approved events and why some might not
 * appear in the homepage calendar.
 *
 * Run with:
 *   node scripts/debug-approved-events.js
 *
 * This script:
 * - Loads .env manually (like test-db-connection.js)
 * - Prints APPROVED events in and around a target date/city
 * - Simulates the getEvents() filtering logic to see which events
 *   actually make it into the calendar data.
 */

const path = require("path");
const fs = require("fs");

// --- Load .env (same pattern as test-db-connection.js) ---
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
}

const { PrismaClient } = require("@prisma/client");
const {
  addMonths,
  startOfDay,
  endOfDay,
  isWithinInterval,
} = require("date-fns");
const { generateRecurrenceInstances } = require("./lib/recurrence");

const prisma = new PrismaClient();

async function main() {
  console.log("Debugging approved events visibility...\n");

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Ensure .env is configured.");
    process.exit(1);
  }

  const now = new Date();
  const rangeStart = startOfDay(addMonths(now, -1));
  const rangeEnd = endOfDay(addMonths(now, 4));

  console.log("Calendar window (getEvents):");
  console.log("  rangeStart:", rangeStart.toISOString());
  console.log("  rangeEnd  :", rangeEnd.toISOString());
  console.log("");

  // 1) Find APPROVED events in/near Detroit for March 2026 (or around now)
  const focusStart = new Date("2026-03-01T00:00:00.000Z");
  const focusEnd = new Date("2026-03-31T23:59:59.999Z");

  const detroitEvents = await prisma.event.findMany({
    where: {
      status: "APPROVED",
      city: { contains: "Detroit", mode: "insensitive" },
      startTime: {
        gte: focusStart,
        lte: focusEnd,
      },
    },
    include: {
      recurrenceRule: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  console.log("Approved events in Detroit during March 2026 (raw DB rows):");
  console.log(JSON.stringify(detroitEvents, null, 2));
  console.log("");

  // 2) Simulate the homepage getEvents() query and filtering
  const eventsForCalendar = await prisma.event.findMany({
    where: {
      status: "APPROVED",
      startTime: {
        gte: rangeStart,
      },
    },
    include: {
      organizer: {
        select: { name: true },
      },
      recurrenceRule: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const calendarEvents = [];

  for (const event of eventsForCalendar) {
    const baseInfo = {
      id: event.id,
      title: event.title,
      city: event.city,
      venue: event.venue,
      status: event.status,
      isRecurring: event.isRecurring,
      startTime: event.startTime,
      endTime: event.endTime,
    };

    if (!event.isRecurring || !event.recurrenceRule) {
      calendarEvents.push({
        ...baseInfo,
        instanceStart: event.startTime,
        instanceEnd: event.endTime,
      });
      continue;
    }

    const config = {
      frequency: event.recurrenceRule.frequency,
      interval: event.recurrenceRule.interval,
      daysOfWeek: event.recurrenceRule.daysOfWeek,
      until: event.recurrenceRule.until || undefined,
      count: event.recurrenceRule.count || undefined,
    };

    const instances = generateRecurrenceInstances(
      event.startTime,
      event.endTime,
      config
    );

    const instancesInRange = instances.filter((inst) =>
      isWithinInterval(inst.startTime, { start: rangeStart, end: rangeEnd })
    );

    for (const inst of instancesInRange) {
      calendarEvents.push({
        ...baseInfo,
        instanceStart: inst.startTime,
        instanceEnd: inst.endTime,
      });
    }
  }

  // 3) Show which of these calendarEvents occur on March 29, 2026
  const targetDayStart = new Date("2026-03-29T00:00:00.000Z");
  const targetDayEnd = new Date("2026-03-29T23:59:59.999Z");

  const eventsOnTargetDay = calendarEvents.filter(
    (e) => e.instanceStart >= targetDayStart && e.instanceStart <= targetDayEnd
  );

  console.log("Calendar events that would render on 2026-03-29 (UTC day window):");
  console.log(JSON.stringify(eventsOnTargetDay, null, 2));
}

main()
  .catch((err) => {
    console.error("Error in debug-approved-events:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

