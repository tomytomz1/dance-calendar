await import('./assert-isolated-audit.mjs');
import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
const db = new PrismaClient();
const instant = value => new Date(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z');
try {
  if (await db.user.count({ where: { NOT: { email: { endsWith: '@example.invalid' } } } })) throw new Error('Unexpected real identity in QA fixture');
  const ownerId = 'releaseqa-public-snapshot-owner';
  await db.user.upsert({ where: { id: ownerId }, create: { id: ownerId, email: `${ownerId}@example.invalid`, name: 'Synthetic snapshot organizer', role: 'ORGANIZER', verified: true }, update: {} });
  // Retain integration evidence but exclude accumulated synthetic events from the benchmark.
  await db.event.updateMany({ where: { NOT: { id: { startsWith: 'snapshot-' } } }, data: { status: 'DRAFT' } });
  const rows = JSON.parse(await readFile('tests/fixtures/public-events-snapshot.json', 'utf8'));
  for (const row of rows) {
    const id = `snapshot-${row.id}`;
    const data = { title: row.title, slug: row.slug, description: row.description, danceStyles: row.danceStyles, venue: row.venue, address: row.address, city: row.city, startTime: instant(row.startTime), endTime: instant(row.endTime), imageUrl: row.imageUrl, ticketUrl: row.ticketUrl, price: row.price, status: 'APPROVED', isRecurring: row.isRecurring, organizerId: ownerId };
    await db.event.upsert({ where: { id }, create: { id, ...data }, update: data });
    if (row.recurrenceRule) {
      const r = row.recurrenceRule; const data = { frequency: r.frequency, interval: r.interval, daysOfWeek: r.daysOfWeek ?? [], until: r.until ? instant(r.until) : null, count: r.count, monthlyPattern: r.monthlyPattern ?? 'BY_DATE', monthlyDayOfWeek: r.monthlyDayOfWeek, monthlyWeeks: r.monthlyWeeks ?? [] };
      await db.recurrenceRule.upsert({ where: { eventId: id }, create: { eventId: id, ...data }, update: data });
    }
  }
  const browserOwner = 'releaseqa-browser-owner';
  await db.user.upsert({ where: { id: browserOwner }, create: { id: browserOwner, email: `${browserOwner}@example.invalid`, name: 'Synthetic owner', role: 'ORGANIZER', verified: true }, update: { role: 'ORGANIZER', verified: true } });
  for (const [id, title, start, end, recurring] of [
    ['releaseqa-hoover-nov', 'Hoover St November Social QA', '2026-11-14T01:30Z', '2026-11-14T06:00Z', false],
    ['releaseqa-browser-series', 'Synthetic Recurring Edit', '2026-11-21T01:20Z', '2026-11-21T06:00Z', true],
  ]) {
    const data = { title, slug: id, danceStyles: ['Salsa'], venue: 'Synthetic venue', address: '123 QA Street', city: 'Royal Oak', organizerId: browserOwner, status: 'APPROVED', startTime: new Date(start), endTime: new Date(end), isRecurring: recurring };
    await db.event.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
  const rule = { frequency: 'WEEKLY', interval: 2, daysOfWeek: [5], count: 5, until: null, monthlyWeeks: [] };
  await db.recurrenceRule.upsert({ where: { eventId: 'releaseqa-browser-series' }, create: { eventId: 'releaseqa-browser-series', ...rule }, update: rule });
  console.log(`BENCHMARK FIXTURE: ${rows.length} public-event snapshots with synthetic ownership, plus 2 browser fixtures; accumulated test events excluded.`);
} finally { await db.$disconnect(); }
