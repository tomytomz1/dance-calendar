import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
await import('../../scripts/assert-isolated-audit.mjs');
const requireTool = createRequire('/tmp/mdl-qa-browser/package.json');
const { chromium } = requireTool('playwright-core');
const chromiumBinary = requireTool('@sparticuz/chromium').default || requireTool('@sparticuz/chromium');
const axePath = requireTool.resolve('axe-core/axe.min.js');
const db = new PrismaClient();
const bcrypt = (await import('bcryptjs')).default;
const base = 'http://127.0.0.1:3100';
const results = { checks: [], accessibility: [], timezone: [], performance: [], errors: [], scope: 'Production-mode isolated candidate; synthetic records; no production writes' };
const password = 'Synthetic-QA-Only-2026!';
const ids = Object.fromEntries(['owner', 'other', 'user', 'admin', 'pending'].map(role => [role, `releaseqa-browser-${role}`]));
for (const [who, id] of Object.entries(ids)) {
  const data = { email: `${id}@example.invalid`, name: `Synthetic ${who}`, password: await bcrypt.hash(password, 12), role: who === 'admin' ? 'ADMIN' : who === 'user' ? 'USER' : 'ORGANIZER', verified: who !== 'pending' };
  await db.user.upsert({ where: { id }, create: { id, ...data }, update: data });
}
const makeEvent = async (id, overrides = {}) => db.event.upsert({ where: { id }, create: { id, title: 'Synthetic QA Social', slug: id, danceStyles: ['Salsa'], venue: 'Synthetic venue', address: '123 QA Street', city: 'Royal Oak', organizerId: ids.owner, status: 'APPROVED', startTime: new Date('2026-11-14T01:30Z'), endTime: new Date('2026-11-14T06:00Z'), ...overrides }, update: overrides });
await makeEvent('releaseqa-hoover-nov', { title: 'Hoover St November Social QA', startTime: new Date('2026-11-14T01:30Z'), endTime: new Date('2026-11-14T06:00Z') });
await makeEvent('releaseqa-browser-series', { title: 'Synthetic Recurring Edit', isRecurring: true, startTime: new Date('2026-11-21T01:20Z'), endTime: new Date('2026-11-21T06:00Z'), ticketUrl: 'https://example.invalid/tickets', imageUrl: 'https://example.invalid/flyer.jpg' });
await db.recurrenceRule.upsert({ where: { eventId: 'releaseqa-browser-series' }, create: { eventId: 'releaseqa-browser-series', frequency: 'WEEKLY', interval: 2, daysOfWeek: [5], count: 5, monthlyWeeks: [] }, update: { frequency: 'WEEKLY', interval: 2, daysOfWeek: [5], count: 5, until: null } });
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3100'], { env: { ...process.env, PORT: '3100', AUTH_URL: base, NEXTAUTH_URL: base, NEXT_PUBLIC_APP_URL: base, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'] });
server.stderr.on('data', chunk => { const text = chunk.toString(); if (/Error|error/.test(text)) results.errors.push(text.slice(0, 600)); });
for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 300)); }
const browser = await chromium.launch({ executablePath: await chromiumBinary.executablePath(), args: chromiumBinary.args.filter(arg => arg !== '--single-process'), headless: true });
const check = async (name, fn) => { let row; try { await fn(); row = { name, status: 'PASS' }; } catch (error) { row = { name, status: 'FAIL', error: error.message.slice(0, 700) }; } results.checks.push(row); console.log('QA_CHECK ' + JSON.stringify(row)); };
const context = async (options = {}) => {
  const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  await c.route('**/*', route => { const u = new URL(route.request().url()); return u.origin === base ? route.continue() : route.abort(); });
  return c;
};
const login = async (c, who, destination = '/organizer/events') => {
  const page = await c.newPage(); await page.goto(`${base}/login?callbackUrl=${encodeURIComponent(destination)}`);
  await page.getByLabel('Email', { exact: true }).fill(`${ids[who]}@example.invalid`);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(`${base}${destination}`, { timeout: 20000 }); return page;
};
const select = async (page, name, option) => { await page.getByRole('combobox', { name, exact: true }).click(); await page.getByRole('option', { name: option, exact: true }).click(); };
const owner = await context(); let ownerPage;
await check('Real credentials login and populated My Events', async () => { ownerPage = await login(owner, 'owner'); await ownerPage.getByText('Synthetic Recurring Edit', { exact: true }).waitFor(); });
await check('Editor preserves non-quarter-hour minutes and saves optional URL clearing', async () => {
  const page = ownerPage; await page.goto(`${base}/organizer/events/releaseqa-browser-series/edit`);
  assert.equal((await page.getByRole('combobox', { name: 'Start minute', exact: true }).innerText()).trim(), '20');
  await page.getByLabel('Ticket URL', { exact: true }).fill(''); await page.getByLabel('Event Image URL', { exact: true }).fill('');
  await page.getByLabel('Event Title', { exact: true }).fill('Synthetic Recurring Edited');
  const response = page.waitForResponse(r => r.url().endsWith('/api/events/releaseqa-browser-series') && r.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Update Event', exact: true }).click();
  if (await page.getByRole('button', { name: 'Continue Anyway', exact: true }).isVisible()) await page.getByRole('button', { name: 'Continue Anyway', exact: true }).click();
  assert.equal((await response).status(), 200); await page.waitForURL(`${base}/organizer/events`);
  const e = await db.event.findUniqueOrThrow({ where: { id: 'releaseqa-browser-series' }, include: { recurrenceRule: true } });
  assert.equal(e.imageUrl, null); assert.equal(e.ticketUrl, null); assert.equal(e.recurrenceRule.interval, 2); assert.deepEqual(e.recurrenceRule.daysOfWeek, [5]); assert.equal(e.recurrenceRule.count, 5); assert.equal(e.startTime.toISOString(), '2026-11-21T01:20:00.000Z');
});
await check('Actual saved form disables recurrence and removes future ordinary rows', async () => {
  const page = ownerPage; await page.goto(`${base}/organizer/events/releaseqa-browser-series/edit`);
  await page.getByRole('button', { name: 'Recurring Event', exact: true }).click();
  const response = page.waitForResponse(r => r.url().endsWith('/api/events/releaseqa-browser-series') && r.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Update Event', exact: true }).click();
  if (await page.getByRole('button', { name: 'Continue Anyway', exact: true }).isVisible()) await page.getByRole('button', { name: 'Continue Anyway', exact: true }).click();
  assert.equal((await response).status(), 200); assert.equal(await db.eventInstance.count({ where: { eventId: 'releaseqa-browser-series', isModified: false, isCancelled: false } }), 0);
});
await check('Real browser create form validates required values and saves a Michigan overnight event', async () => {
  const page = ownerPage; await page.goto(`${base}/organizer/events/new`);
  await page.getByRole('button', { name: 'Create Event', exact: true }).click(); assert.ok(await page.locator('[data-slot="form-message"]').count());
  await page.getByLabel('Event Title', { exact: true }).fill('Synthetic Browser Created Social'); await page.getByRole('button', { name: 'Salsa', exact: true }).click();
  await page.getByLabel('Venue Name', { exact: true }).fill('Synthetic unique venue'); await page.getByLabel('Address', { exact: true }).fill('123 Synthetic Street'); await page.getByLabel('City', { exact: true }).fill('Isolated QA City');
  await page.getByRole('button', { name: 'Start Date', exact: true }).click(); await page.getByRole('dialog', { name: 'Choose start date' }).getByRole('button', { name: /November 13/ }).click();
  await page.getByRole('button', { name: 'End Date', exact: true }).click(); await page.getByRole('dialog', { name: 'Choose end date' }).getByRole('button', { name: /November 14/ }).click();
  await select(page, 'Start hour', '9'); await select(page, 'Start minute', '20'); await select(page, 'Start AM/PM', 'PM'); await select(page, 'End hour', '1'); await select(page, 'End minute', '00'); await select(page, 'End AM/PM', 'AM');
  const response = page.waitForResponse(r => r.url().endsWith('/api/events') && r.request().method() === 'POST'); await page.getByRole('button', { name: 'Create Event', exact: true }).click();
  const r = await response; assert.equal(r.status(), 201); const e = await r.json(); assert.equal(e.startTime, '2026-11-14T02:20:00.000Z'); assert.equal(e.endTime, '2026-11-14T06:00:00.000Z');
});
for (const who of ['other', 'user']) await check(`Real ${who} session cannot mutate foreign events or read admin records`, async () => {
  const c = await context(); const page = await login(c, who, who === 'user' ? '/' : '/organizer/events');
  const before = await db.event.findUniqueOrThrow({ where: { id: 'releaseqa-hoover-nov' } });
  for (const [method, endpoint, data] of [['patch', '/api/events/releaseqa-hoover-nov', { title: 'Forbidden' }], ['delete', '/api/events/releaseqa-hoover-nov'], ['post', '/api/events/releaseqa-hoover-nov/instances']]) assert.equal((await c.request[method](base + endpoint, { data })).status(), 403);
  assert.equal((await c.request.get(base + '/api/admin/users')).status(), 401); assert.equal((await c.request.post(base + `/api/admin/users/${ids.pending}/approve`)).status(), 401);
  assert.deepEqual(await db.event.findUniqueOrThrow({ where: { id: before.id } }), before);
  await page.goto(`${base}/admin`); await page.waitForURL(url => !url.pathname.endsWith('/admin')); await c.close();
});
await check('Real admin session approves a synthetic pending organizer', async () => {
  const c = await context(); await login(c, 'admin', '/admin'); const response = await c.request.post(base + `/api/admin/users/${ids.pending}/approve`); assert.equal(response.status(), 200); assert.equal((await db.user.findUniqueOrThrow({ where: { id: ids.pending } })).verified, true); await c.close();
});
await check('Unauthenticated HTTP mutation requests cannot change isolated records', async () => {
  const c = await context(); for (const [method, path] of [['patch', '/api/events/releaseqa-hoover-nov'], ['delete', '/api/events/releaseqa-hoover-nov'], ['post', '/api/events/releaseqa-hoover-nov/instances'], ['post', '/api/events']]) assert.equal((await c.request[method](base + path, { data: {} })).status(), 401); await c.close();
});
for (const tz of ['America/Detroit', 'UTC', 'America/Los_Angeles', 'Asia/Tokyo']) await check(`Browser Michigan dates and editor round-trip in ${tz}`, async () => {
  const c = await context({ timezoneId: tz }); const p = await c.newPage(); await p.goto(base + '/event/releaseqa-hoover-nov'); const json = await p.locator('script[type="application/ld+json"]').allTextContents(); assert.ok(json.some(s => s.includes('2026-11-14T01:30:00')));
  assert.match(await p.locator('main').innerText(), /8:30\s*PM/i); await p.close(); const page = await login(c, 'owner', '/organizer/events/releaseqa-hoover-nov/edit');
  assert.match(await page.getByRole('button', { name: 'Start Date', exact: true }).innerText(), /November 13/); assert.equal((await page.getByRole('combobox', { name: 'Start hour' }).innerText()).trim(), '8'); assert.equal((await page.getByRole('combobox', { name: 'Start AM/PM' }).innerText()).trim(), 'PM'); results.timezone.push({ timezone: tz, status: 'PASS' }); await c.close();
});
const publicPaths = ['/', '/calendar', '/events', '/event/releaseqa-hoover-nov', '/events/city/royal-oak', '/events/style/salsa', '/login', '/register', '/forgot-password', '/reset-password', '/privacy', '/terms', '/contact', '/unsubscribe'];
for (const width of [1440, 390]) {
  const c = await context({ viewport: { width, height: 1000 } }); const page = await c.newPage();
  for (const path of publicPaths) await check(`axe WCAG 2.1 AA ${width}px ${path}`, async () => {
    const response = await page.goto(base + path); assert.ok(response.status() < 400); await page.addScriptTag({ path: axePath });
    const report = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    const violations = report.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target, summary: n.failureSummary })) })); results.accessibility.push({ width, path, violations, incomplete: report.incomplete.map(v => v.id) }); assert.equal(violations.length, 0, JSON.stringify(violations).slice(0, 2000));
  }); await c.close();
  const authContext = await context({ viewport: { width, height: 1000 } }); const authPage = await login(authContext, 'admin', '/admin');
  for (const path of ['/admin', '/organizer/events', '/organizer/events/new', '/organizer/events/releaseqa-hoover-nov/edit', '/profile']) await check(`authenticated axe ${width}px ${path}`, async () => {
    await authPage.goto(base + path); await authPage.addScriptTag({ path: axePath }); const report = await authPage.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })); const violations = report.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target, summary: n.failureSummary })) })); results.accessibility.push({ width, path, violations, incomplete: report.incomplete.map(v => v.id) }); assert.equal(violations.length, 0, JSON.stringify(violations).slice(0, 2000));
  }); await authContext.close();
}
await owner.close(); await browser.close(); server.kill('SIGTERM'); await db.$disconnect();
await mkdir('public', { recursive: true }); await writeFile('public/qa-release-report.json', JSON.stringify(results, null, 2));
for (const row of results.accessibility) if (row.violations.length) console.log('QA_AXE ' + JSON.stringify(row));
console.log('QA_TIMEZONES ' + JSON.stringify(results.timezone));
console.log(`QA_BROWSER_TOTAL passed=${results.checks.filter(c => c.status === 'PASS').length} failed=${results.checks.filter(c => c.status === 'FAIL').length} skipped=0`);
// Keep the isolated preview available even when evidence reveals defects.
// The release verdict uses every failed result, never just deployment READY.
