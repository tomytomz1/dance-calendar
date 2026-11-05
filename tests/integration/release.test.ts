import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const session = vi.hoisted(() => ({ current: null as null | { user: { id: string; role: string; verified: boolean } } }));
vi.mock('@/lib/auth', () => ({ auth: async () => session.current }));
// Direct handler tests have no Next request store. Real HTTP browser tests
// below separately verify public-cache invalidation after a published save.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import { prisma } from '@/lib/prisma';
import { generateInstancesForEvent } from '@/lib/recurrence';
import * as events from '@/app/api/events/route';
import * as event from '@/app/api/events/[id]/route';
import * as instances from '@/app/api/events/[id]/instances/route';
import * as admin from '@/app/api/admin/events/route';
import * as approve from '@/app/api/admin/users/[id]/approve/route';
import * as adminUsers from '@/app/api/admin/users/route';
import * as adminPending from '@/app/api/admin/events/pending/route';

const run = `releaseqa-${Date.now()}`;
const ids = { owner: `${run}-owner`, other: `${run}-other`, admin: `${run}-admin`, user: `${run}-user`, pending: `${run}-pending` };
const body = { title: 'Isolated QA social', danceStyles: ['Salsa'], venue: 'Synthetic QA venue', address: '123 Synthetic QA Street', city: 'Royal Oak', startTime: '2027-01-16T02:00:00.000Z', endTime: '2027-01-16T07:00:00.000Z', isRecurring: true, recurrence: { frequency: 'WEEKLY', interval: 1, count: 4 } };
const req = (method: string, data?: object) => new Request('https://isolated.invalid/api/events', { method, headers: { 'Content-Type': 'application/json' }, ...(data ? { body: JSON.stringify(data) } : {}) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const login = (who: keyof typeof ids, role = who === 'admin' ? 'ADMIN' : who === 'user' ? 'USER' : 'ORGANIZER', verified = who !== 'pending') => { session.current = { user: { id: ids[who], role, verified } }; };
const make = async (suffix: string) => prisma.event.create({ data: { id: `${run}-${suffix}`, title: suffix, danceStyles: ['Salsa'], venue: 'QA', address: '123 QA St', city: 'Royal Oak', organizerId: ids.owner, startTime: new Date(body.startTime), endTime: new Date(body.endTime), status: 'APPROVED', isRecurring: true, recurrenceRule: { create: { frequency: 'WEEKLY', interval: 1, daysOfWeek: [], monthlyWeeks: [], count: 4 } } } });
beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL || 'http://invalid');
  if (process.env.MDL_ISOLATED_AUDIT !== 'pr5-release-2026-11-04' || !/^ep-divine-mud-aipcfj3f(?:-pooler)?\./.test(url.hostname) || url.pathname !== '/audit_pr5_release') throw new Error('Refusing integration writes outside isolated QA database');
  const [actual] = await prisma.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;
  expect(actual.name).toBe('audit_pr5_release');
  const password = await bcrypt.hash('Synthetic-QA-Only-2026!', 12);
  for (const [who, id] of Object.entries(ids)) await prisma.user.create({ data: { id, email: `${id}@example.invalid`, name: `Synthetic ${who}`, password, role: who === 'admin' ? 'ADMIN' : who === 'user' ? 'USER' : 'ORGANIZER', verified: who !== 'pending' } });
  console.log('Synthetic fixture prefix:', run);
});
afterAll(async () => { await prisma.$disconnect(); });

it('saves and reads a real organizer event without mocked persistence', async () => {
  login('owner'); const response = await events.POST(req('POST', body)); expect(response.status).toBe(201);
  const saved = await response.json(); expect(saved.organizerId).toBe(ids.owner); expect(await prisma.eventInstance.count({ where: { eventId: saved.id } })).toBe(4);
  const loaded = await event.GET(req('GET'), params(saved.id)); expect(loaded.status).toBe(200); expect((await loaded.json()).startTime).toBe(body.startTime);
});
it('denies strangers and foreign organizers with persistent data unchanged', async () => {
  const e = await make('ownership'); const before = await prisma.event.findUnique({ where: { id: e.id } });
  for (const who of [null, 'other', 'user'] as const) {
    if (who) login(who); else session.current = null;
    const expected = who ? 403 : 401;
    expect((await event.PATCH(req('PATCH', { title: 'Unauthorized' }), params(e.id))).status).toBe(expected);
    expect((await event.DELETE(req('DELETE'), params(e.id))).status).toBe(expected);
    expect((await instances.POST(req('POST'), params(e.id))).status).toBe(expected);
    expect((await admin.GET(req('GET'))).status).toBe(401);
  }
  expect(await prisma.event.findUnique({ where: { id: e.id } })).toEqual(before);
});
it('enforces creation verification and prevents ownership mass assignment', async () => {
  for (const who of ['user', 'pending'] as const) { login(who); expect((await events.POST(req('POST', body))).status).toBe(403); }
  login('owner'); const response = await events.POST(req('POST', { ...body, organizerId: ids.other, status: 'DRAFT' })); expect(response.status).toBe(201); expect((await response.json()).organizerId).toBe(ids.owner);
});
it('allows admin moderation and rejects organizer moderation', async () => {
  login('other'); expect((await approve.POST(req('POST'), params(ids.pending))).status).toBe(401);
  expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.pending } })).verified).toBe(false);
  login('admin'); expect((await approve.POST(req('POST'), params(ids.pending))).status).toBe(200);
  expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.pending } })).verified).toBe(true);
});
it('rejects invalid URL and backward dates before persistent mutation', async () => {
  const e = await make('validation'); login('owner');
  for (const patch of [{ ticketUrl: 'javascript:alert(1)' }, { endTime: '2026-01-01T00:00:00Z' }]) expect((await event.PATCH(req('PATCH', patch), params(e.id))).status).toBe(400);
  expect((await prisma.event.findUniqueOrThrow({ where: { id: e.id } })).endTime).toEqual(e.endTime);
});
it('serializes eight genuinely overlapping Prisma generators', async () => {
  const e = await make('concurrent');
  const blocker = new PrismaClient(); let release!: () => void; let locked!: () => void;
  const ready = new Promise<void>(resolve => { locked = resolve; }); const hold = new Promise<void>(resolve => { release = resolve; });
  const lock = blocker.$transaction(async tx => { await tx.$queryRaw`SELECT id FROM "Event" WHERE id=${e.id} FOR UPDATE`; locked(); await hold; }, { timeout: 30000 });
  await ready;
  const work = Array.from({ length: 8 }, () => generateInstancesForEvent(e.id));
  // Prove all workers have been submitted while the row lock is held.
  await new Promise(resolve => setTimeout(resolve, 350)); release();
  const counts = await Promise.all(work); await lock; await blocker.$disconnect();
  expect(counts.reduce((a, b) => a + b, 0)).toBe(4);
  const rows = await prisma.eventInstance.findMany({ where: { eventId: e.id } }); expect(rows).toHaveLength(4); expect(new Set(rows.map(x => x.startTime.toISOString())).size).toBe(4);
  expect(await generateInstancesForEvent(e.id)).toBe(0);
});
it('preserves duplicate history and cancelled/modified exceptions during replacement', async () => {
  const e = await make('exceptions'); await generateInstancesForEvent(e.id);
  const rows = await prisma.eventInstance.findMany({ where: { eventId: e.id }, orderBy: { startTime: 'asc' } });
  await prisma.eventInstance.update({ where: { id: rows[0].id }, data: { isModified: true, modifiedTitle: 'Exception' } });
  await prisma.eventInstance.update({ where: { id: rows[1].id }, data: { isCancelled: true } });
  await Promise.all([generateInstancesForEvent(e.id, { replaceFuture: true }), generateInstancesForEvent(e.id), generateInstancesForEvent(e.id)]);
  expect(await prisma.eventInstance.count({ where: { eventId: e.id } })).toBe(4);
  expect((await prisma.eventInstance.findUniqueOrThrow({ where: { id: rows[0].id } })).modifiedTitle).toBe('Exception');
  expect((await prisma.eventInstance.findUniqueOrThrow({ where: { id: rows[1].id } })).isCancelled).toBe(true);
  const history = { eventId: e.id, startTime: new Date('2020-01-01T02:00Z'), endTime: new Date('2020-01-01T07:00Z') };
  await prisma.eventInstance.createMany({ data: [history, history] }); await generateInstancesForEvent(e.id);
  expect(await prisma.eventInstance.count({ where: { eventId: e.id, startTime: history.startTime } })).toBe(2);
});
it('removes ordinary future instances when recurrence is disabled', async () => {
  const e = await make('disable'); await generateInstancesForEvent(e.id); login('owner');
  const response = await event.PATCH(req('PATCH', { isRecurring: false }), params(e.id)); expect(response.status).toBe(200);
  expect(await prisma.eventInstance.count({ where: { eventId: e.id, isModified: false, isCancelled: false } })).toBe(0);
  expect(await (await instances.GET(req('GET'), params(e.id))).json()).toEqual([]);
});
it('replaces obsolete future timestamps after a series time correction', async () => {
  const e = await make('correction'); await generateInstancesForEvent(e.id); login('owner');
  const response = await event.PATCH(req('PATCH', { startTime: '2027-01-16T03:00:00Z', endTime: '2027-01-16T08:00:00Z' }), params(e.id)); expect(response.status).toBe(200);
  const rows = await prisma.eventInstance.findMany({ where: { eventId: e.id } }); expect(rows).toHaveLength(4); expect(rows.every(x => x.startTime.getUTCHours() === 3)).toBe(true);
});
it('clears stored optional URLs on an explicit empty edit', async () => {
  const e = await make('clear-urls'); login('owner');
  await prisma.event.update({ where: { id: e.id }, data: { imageUrl: 'https://example.invalid/image.jpg', ticketUrl: 'https://example.invalid/tickets' } });
  const response = await event.PATCH(req('PATCH', { imageUrl: '', ticketUrl: '' }), params(e.id)); expect(response.status).toBe(200);
  const saved = await prisma.event.findUniqueOrThrow({ where: { id: e.id } }); expect(saved.imageUrl).toBeNull(); expect(saved.ticketUrl).toBeNull();
});
it('blocks revoked and demoted owners even though their event ownership is unchanged', async () => {
  const e = await make('revoked-owner');
  for (const flags of [{ role: 'USER', verified: true }, { role: 'ORGANIZER', verified: false }]) {
    session.current = { user: { id: ids.owner, ...flags } };
    expect((await event.PATCH(req('PATCH', { title: 'Revoked write' }), params(e.id))).status).toBe(403);
    expect((await event.DELETE(req('DELETE'), params(e.id))).status).toBe(403);
    expect((await instances.POST(req('POST'), params(e.id))).status).toBe(403);
  }
  expect((await prisma.event.findUniqueOrThrow({ where: { id: e.id } })).title).toBe('revoked-owner');
});
it('keeps a published event URL stable when its title changes', async () => {
  const e = await make('stable-url'); await prisma.event.update({ where: { id: e.id }, data: { slug: `${run}-shared-link` } }); login('owner');
  const r = await event.PATCH(req('PATCH', { title: 'Corrected event title' }), params(e.id)); expect(r.status).toBe(200);
  expect((await r.json()).slug).toBe(`${run}-shared-link`);
});
it('reports global admin totals independently of paginated rows', async () => {
  login('admin');
  const all = await admin.GET(new Request('https://isolated.invalid/api/admin/events?limit=1'));
  expect((await all.json()).length).toBe(1); expect(Number(all.headers.get('X-Total-Count'))).toBe(await prisma.event.count());
  const pending = await adminPending.GET(new Request('https://isolated.invalid/api/admin/events/pending?limit=1'));
  expect(Number(pending.headers.get('X-Total-Count'))).toBe(await prisma.event.count({ where: { status: 'PENDING_APPROVAL' } }));
  const users = await (await adminUsers.GET(new Request('https://isolated.invalid/api/admin/users?limit=1'))).json();
  expect(users.pendingOrganizersCount).toBe(await prisma.user.count({ where: { role: 'ORGANIZER', verified: false } }));
});
