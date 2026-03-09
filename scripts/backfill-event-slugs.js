/**
 * Backfill slug field for existing events based on their title.
 *
 * Run with:
 *   node scripts/backfill-event-slugs.js
 */

const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

// Load .env manually (same pattern as other scripts)
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

const prisma = new PrismaClient();

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function main() {
  console.log("Backfilling event slugs...");

  const events = await prisma.event.findMany({
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  const usedSlugs = new Set(
    events
      .map((e) => e.slug)
      .filter((s) => typeof s === "string" && s.length > 0)
  );

  let updatedCount = 0;

  for (const event of events) {
    if (event.slug) continue;

    const base = slugify(event.title || "");
    if (!base) {
      console.warn(
        `Skipping event ${event.id} with empty/invalid title for slug generation`
      );
      continue;
    }

    let candidate = base;
    let counter = 2;
    while (usedSlugs.has(candidate)) {
      candidate = `${base}-${counter}`;
      counter += 1;
    }

    await prisma.event.update({
      where: { id: event.id },
      data: { slug: candidate },
    });

    usedSlugs.add(candidate);
    updatedCount += 1;
    console.log(`Set slug for event ${event.id} -> ${candidate}`);
  }

  console.log(`Done. Updated ${updatedCount} events.`);
}

main()
  .catch((err) => {
    console.error("Error backfilling slugs:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

