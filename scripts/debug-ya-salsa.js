/**
 * Debug a specific event (YA Salsa Social) and why it may not
 * appear on March 29, 2026 in the calendar.
 *
 * Run with:
 *   node scripts/debug-ya-salsa.js
 */

const path = require("path");
const fs = require("fs");

// Load .env similar to test-db-connection.js
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
  console.log("Debugging YA Salsa Social event...\n");

  const events = await prisma.event.findMany({
    where: {
      title: {
        contains: "YA Salsa Social",
        mode: "insensitive",
      },
    },
    include: {
      recurrenceRule: true,
      organizer: {
        select: { name: true },
      },
    },
  });

  console.log("Matched events by title:");
  console.log(JSON.stringify(events, null, 2));

  if (!events.length) {
    console.log("\nNo events found matching 'YA Salsa Social'.");
    return;
  }

  const event = events[0];

  const now = new Date();
  const rangeStart = startOfDay(addMonths(now, -1));
  const rangeEnd = endOfDay(addMonths(now, 4));

  console.log("\nCalendar range used by getEvents():");
  console.log("  rangeStart:", rangeStart.toISOString());
  console.log("  rangeEnd  :", rangeEnd.toISOString());

  if (!event.isRecurring || !event.recurrenceRule) {
    console.log("\nEvent is NOT recurring according to DB. It should appear as a single event.");
    const inRange = isWithinInterval(event.startTime, {
      start: rangeStart,
      end: rangeEnd,
    });
    console.log("  startTime:", event.startTime.toISOString(), "inRange:", inRange);
    return;
  }

  console.log("\nEvent IS recurring. Recurrence rule:");
  console.log(JSON.stringify(event.recurrenceRule, null, 2));

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

  console.log(`\nTotal generated instances (before date-range filter): ${instances.length}`);

  const instancesInRange = instances.filter((inst) =>
    isWithinInterval(inst.startTime, { start: rangeStart, end: rangeEnd })
  );

  console.log(
    `Instances within calendar range (${rangeStart.toISOString()} - ${rangeEnd.toISOString()}):`
  );
  console.log(
    instancesInRange.map((i) => ({
      start: i.startTime.toISOString(),
      end: i.endTime.toISOString(),
    }))
  );

  // Now check which instances overlap local March 29, 2026
  const targetLocal = new Date(2026, 2, 29, 0, 0, 0); // March=2 (0-based)
  const dayStart = startOfDay(targetLocal);
  const dayEnd = endOfDay(targetLocal);

  const overlapping = instancesInRange.filter((inst) => {
    const s = inst.startTime;
    const e = inst.endTime;
    return e > dayStart && s < dayEnd;
  });

  console.log("\nInstances that overlap local March 29, 2026:");
  console.log(
    overlapping.map((i) => ({
      start: i.startTime.toString(),
      end: i.endTime.toString(),
    }))
  );
}

main()
  .catch((err) => {
    console.error("Error in debug-ya-salsa:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

