import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { chromiumArgs } from './chromium-args.mjs';
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
const ids = Object.fromEntries(['owner', 'other', 'user', 'admin', 'pending', 'recovery'].map(role => [role, `releaseqa-browser-${role}`]));
for (const [who, id] of Object.entries(ids)) {
  const data = { email: `${id}@example.invalid`, name: `Synthetic ${who}`, password: await bcrypt.hash(password, 12), role: who === 'admin' ? 'ADMIN' : ['user', 'recovery'].includes(who) ? 'USER' : 'ORGANIZER', verified: who !== 'pending' };
  await db.user.upsert({ where: { id }, create: { id, ...data }, update: data });
}
const makeEvent = async (id, overrides = {}) => db.event.upsert({ where: { id }, create: { id, title: 'Synthetic QA Social', slug: id, danceStyles: ['Salsa'], venue: 'Synthetic venue', address: '123 QA Street', city: 'Royal Oak', organizerId: ids.owner, status: 'APPROVED', startTime: new Date('2026-11-14T01:30Z'), endTime: new Date('2026-11-14T06:00Z'), ...overrides }, update: overrides });
await makeEvent('releaseqa-hoover-nov', { title: 'Hoover St November Social QA', startTime: new Date('2026-11-14T01:30Z'), endTime: new Date('2026-11-14T06:00Z') });
await makeEvent('releaseqa-browser-series', { title: 'Synthetic Recurring Edit', isRecurring: true, startTime: new Date('2026-11-21T01:20Z'), endTime: new Date('2026-11-21T06:00Z'), ticketUrl: 'https://example.invalid/tickets', imageUrl: 'https://example.invalid/flyer.jpg' });
await db.recurrenceRule.upsert({ where: { eventId: 'releaseqa-browser-series' }, create: { eventId: 'releaseqa-browser-series', frequency: 'WEEKLY', interval: 2, daysOfWeek: [5], count: 5, monthlyWeeks: [] }, update: { frequency: 'WEEKLY', interval: 2, daysOfWeek: [5], count: 5, until: null } });
await makeEvent('releaseqa-share-series', { title: 'Synthetic Monthly Social', isRecurring: true, startTime: new Date('2026-04-19T01:00Z'), endTime: new Date('2026-04-19T06:00Z') });
await db.recurrenceRule.upsert({ where: { eventId: 'releaseqa-share-series' }, create: { eventId: 'releaseqa-share-series', frequency: 'MONTHLY', interval: 1, daysOfWeek: [], monthlyPattern: 'BY_WEEKDAY', monthlyDayOfWeek: 6, monthlyWeeks: [3] }, update: { frequency: 'MONTHLY', interval: 1, daysOfWeek: [], monthlyPattern: 'BY_WEEKDAY', monthlyDayOfWeek: 6, monthlyWeeks: [3], until: null, count: null } });
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3100'], { env: { ...process.env, PORT: '3100', AUTH_URL: base, NEXTAUTH_URL: base, NEXT_PUBLIC_APP_URL: base, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'] });
server.stderr.on('data', chunk => { const text = chunk.toString(); if (/Error|error/.test(text)) results.errors.push(text.slice(0, 600)); });
for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 300)); }
const browser = await chromium.launch({ executablePath: await chromiumBinary.executablePath(), args: chromiumArgs, headless: true });
const check = async (name, fn) => { let row; try { await fn(); row = { name, status: 'PASS' }; } catch (error) { row = { name, status: 'FAIL', error: error.message.slice(0, 700) }; } results.checks.push(row); console.log('QA_CHECK ' + JSON.stringify(row)); };
const authCookies = new Map();
const context = async (options = {}) => {
  const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  c.on('page', page => { page.on('pageerror', error => results.errors.push({ type: 'runtime', message: error.message })); page.on('response', r => { if (r.status() >= 500 && r.url().startsWith(base)) results.errors.push({ type: 'http', status: r.status(), path: new URL(r.url()).pathname }); }); });
  await c.route('**/*', route => { const u = new URL(route.request().url()); return u.origin === base ? route.continue() : route.abort(); });
  return c;
};
const waitForTimeControls = page => page.waitForFunction(() => {
  const controls = [...document.querySelectorAll('button[role="combobox"][aria-label]')].filter(e => /^(Start|End) /.test(e.getAttribute('aria-label')));
  return controls.length === 6 && controls.every(e => e.textContent.trim());
});
const login = async (c, who, destination = '/organizer/events') => {
  const page = await c.newPage();
  if (authCookies.has(who)) { await c.addCookies(authCookies.get(who)); await page.goto(`${base}${destination}`); if (destination.endsWith('/edit')) await waitForTimeControls(page); return page; }
  await page.goto(`${base}/login?callbackUrl=${encodeURIComponent(destination)}`);
  await page.getByLabel('Email', { exact: true }).fill(`${ids[who]}@example.invalid`);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(`${base}${destination}`, { timeout: 20000 }); authCookies.set(who, await c.cookies()); if (destination.endsWith('/edit')) await waitForTimeControls(page); return page;
};
const select = async (page, name, option) => { await page.getByRole('combobox', { name, exact: true }).click(); await page.getByRole('option', { name: option, exact: true }).click(); };
const submitEvent = async (page, name, path, method) => {
  const response = page.waitForResponse(r => r.url().endsWith(path) && r.request().method() === method);
  await page.getByRole('button', { name, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Scheduling Conflict', exact: true });
  const outcome = await Promise.race([response.then(() => 'response'), dialog.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'dialog').catch(() => 'no-dialog')]);
  if (outcome === 'dialog') await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  return response;
};
const owner = await context(); let ownerPage;
await check('Login only offers providers configured on the server', async () => {
  const c = await context(); const page = await c.newPage(); const providers = await (await c.request.get(base + '/api/auth/providers')).json();
  await page.goto(base + '/login'); await page.getByLabel('Email', { exact: true }).waitFor();
  if (!providers.google) assert.equal(await page.getByRole('button', { name: 'Continue with Google', exact: true }).count(), 0);
  assert.ok(providers.credentials); await c.close();
});
await check('Real credentials login and populated My Events', async () => { ownerPage = await login(owner, 'owner'); await ownerPage.getByText('Synthetic Recurring Edit', { exact: true }).waitFor(); });
await check('Editor preserves non-quarter-hour minutes and saves optional URL clearing', async () => {
  const page = ownerPage; await page.goto(`${base}/organizer/events/releaseqa-browser-series/edit`); await waitForTimeControls(page);
  assert.equal((await page.getByRole('combobox', { name: 'Start minute', exact: true }).innerText()).trim(), '20');
  await page.getByLabel('Ticket URL', { exact: true }).fill(''); await page.getByLabel('Event Image URL', { exact: true }).fill('');
  await page.getByLabel('Event Title', { exact: true }).fill('Synthetic Recurring Edited');
  const response = await submitEvent(page, 'Update Event', '/api/events/releaseqa-browser-series', 'PATCH');
  assert.equal(response.status(), 200); await page.waitForURL(`${base}/organizer/events`);
  const e = await db.event.findUniqueOrThrow({ where: { id: 'releaseqa-browser-series' }, include: { recurrenceRule: true } });
  assert.equal(e.imageUrl, null); assert.equal(e.ticketUrl, null); assert.equal(e.recurrenceRule.interval, 2); assert.deepEqual(e.recurrenceRule.daysOfWeek, [5]); assert.equal(e.recurrenceRule.count, 5); assert.equal(e.startTime.toISOString(), '2026-11-21T01:20:00.000Z');
});
await check('Actual saved form disables recurrence and removes future ordinary rows', async () => {
  const page = ownerPage; await page.goto(`${base}/organizer/events/releaseqa-browser-series/edit`); await waitForTimeControls(page);
  await page.getByRole('button', { name: 'Recurring Event', exact: true }).click();
  const response = await submitEvent(page, 'Update Event', '/api/events/releaseqa-browser-series', 'PATCH');
  assert.equal(response.status(), 200); assert.equal(await db.eventInstance.count({ where: { eventId: 'releaseqa-browser-series', isModified: false, isCancelled: false } }), 0);
});
await check('Real browser create form validates required values and saves a Michigan overnight event', async () => {
  const page = ownerPage; await page.goto(`${base}/organizer/events/new`); await waitForTimeControls(page);
  await page.getByRole('button', { name: 'Create Event', exact: true }).click(); assert.ok(await page.locator('[data-slot="form-message"]').count());
  await page.getByLabel('Event Title', { exact: true }).fill('Synthetic Browser Created Social'); await page.getByRole('button', { name: 'Salsa', exact: true }).click();
  await page.getByLabel('Venue Name', { exact: true }).fill('Synthetic unique venue'); await page.getByLabel('Address', { exact: true }).fill('123 Synthetic Street'); await page.getByLabel('City', { exact: true }).fill('Isolated QA City');
  await page.getByRole('button', { name: 'Start Date', exact: true }).click(); await page.getByRole('dialog', { name: 'Choose start date' }).getByRole('button', { name: /November 13/ }).click();
  await page.getByRole('button', { name: 'End Date', exact: true }).click(); await page.getByRole('dialog', { name: 'Choose end date' }).getByRole('button', { name: /November 14/ }).click();
  await select(page, 'Start hour', '9'); await select(page, 'Start minute', '20'); await select(page, 'Start AM/PM', 'PM'); await select(page, 'End hour', '1'); await select(page, 'End minute', '00'); await select(page, 'End AM/PM', 'AM');
  await page.getByLabel('Ticket URL', { exact: true }).fill('javascript:alert(1)'); await page.getByRole('button', { name: 'Create Event', exact: true }).click(); await page.locator('[data-slot="form-message"]').filter({ hasText: 'URL' }).first().waitFor(); await page.getByLabel('Ticket URL', { exact: true }).fill('');
  const r = await submitEvent(page, 'Create Event', '/api/events', 'POST'); assert.equal(r.status(), 201); const e = await r.json(); assert.equal(e.startTime, '2026-11-14T02:20:00.000Z'); assert.equal(e.endTime, '2026-11-14T06:00:00.000Z');
});
await check('Published saves immediately refresh the public directory and calendar', async () => {
  const c = await context(); const page = await c.newPage(); await page.goto(base + '/events'); await page.getByText('Synthetic Browser Created Social', { exact: true }).first().waitFor();
  const calendar = await (await c.request.get(base + '/calendar')).text(); assert.ok(calendar.includes('Synthetic Recurring Edited')); assert.ok(calendar.includes('Synthetic Browser Created Social')); await c.close();
});
for (const who of ['other', 'user']) await check(`Real ${who} session cannot mutate foreign events or read admin records`, async () => {
  const c = await context(); const page = await login(c, who, who === 'user' ? '/' : '/organizer/events');
  const before = await db.event.findUniqueOrThrow({ where: { id: 'releaseqa-hoover-nov' } });
  for (const [method, endpoint, data] of [['patch', '/api/events/releaseqa-hoover-nov', { title: 'Forbidden' }], ['delete', '/api/events/releaseqa-hoover-nov'], ['post', '/api/events/releaseqa-hoover-nov/instances']]) assert.equal((await c.request[method](base + endpoint, { data })).status(), 403);
  assert.equal((await c.request.get(base + '/api/admin/users')).status(), 401); assert.equal((await c.request.post(base + `/api/admin/users/${ids.pending}/approve`)).status(), 401);
  assert.deepEqual(await db.event.findUniqueOrThrow({ where: { id: before.id } }), before);
  await page.goto(`${base}/admin`); await page.waitForURL(url => !url.pathname.endsWith('/admin')); await c.close();
});
await check('Existing session loses event-write capability immediately after role or verification revocation', async () => {
  try {
    for (const flags of [{ role: 'USER', verified: true }, { role: 'ORGANIZER', verified: false }]) {
      await db.user.update({ where: { id: ids.owner }, data: flags });
      for (const [method, path, data] of [['patch', '/api/events/releaseqa-hoover-nov', { title: 'Revoked edit' }], ['delete', '/api/events/releaseqa-hoover-nov'], ['post', '/api/events/releaseqa-hoover-nov/instances']]) assert.equal((await owner.request[method](base + path, { data })).status(), 403);
      const actual = await (await owner.request.get(base + '/api/auth/session')).json(); assert.equal(actual.user.role, flags.role); assert.equal(actual.user.verified, flags.verified);
    }
  } finally { await db.user.update({ where: { id: ids.owner }, data: { role: 'ORGANIZER', verified: true } }); }
});
await check('Crafted login callback cannot navigate away from the application', async () => {
  const c = await context(); const page = await c.newPage(); await page.goto(base + '/login?callbackUrl=' + encodeURIComponent('/\t/attacker.example.invalid'));
  await page.getByLabel('Email', { exact: true }).fill(`${ids.user}@example.invalid`); await page.getByLabel('Password', { exact: true }).fill(password); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await page.waitForURL(base + '/'); assert.equal(new URL(page.url()).origin, base); await c.close();
});
await check('Real admin session approves a synthetic pending organizer', async () => {
  const c = await context(); const page = await login(c, 'admin', '/admin');
  const expected = await db.event.count(); await page.getByRole('tab', { name: `Events (${expected})`, exact: true }).waitFor();
  await page.getByRole('tab', { name: /^Organizers \(/ }).click();
  const approve = page.getByRole('button', { name: 'Approve organizer Synthetic pending', exact: true });
  for (let i = 0; i < 10 && !await approve.isVisible(); i++) {
    const next = page.getByRole('tabpanel').getByRole('button', { name: 'Next', exact: true });
    if (!await next.isEnabled()) break; await next.click(); await page.getByRole('tab', { name: /^Organizers \(/ }).waitFor();
  }
  await approve.waitFor();
  const response = page.waitForResponse(r => r.url().endsWith(`/api/admin/users/${ids.pending}/approve`) && r.request().method() === 'POST'); await approve.click();
  assert.equal((await response).status(), 200); assert.equal((await db.user.findUniqueOrThrow({ where: { id: ids.pending } })).verified, true); await c.close();
});
await check('Unauthenticated HTTP mutation requests cannot change isolated records', async () => {
  const c = await context(); for (const [method, path] of [['patch', '/api/events/releaseqa-hoover-nov'], ['delete', '/api/events/releaseqa-hoover-nov'], ['post', '/api/events/releaseqa-hoover-nov/instances'], ['post', '/api/events']]) assert.equal((await c.request[method](base + path, { data: {} })).status(), 401); await c.close();
});
for (const tz of ['America/Detroit', 'UTC', 'America/Los_Angeles', 'Asia/Tokyo']) await check(`Browser Michigan dates and editor round-trip in ${tz}`, async () => {
  const c = await context({ timezoneId: tz }); const p = await c.newPage(); await p.goto(base + '/event/releaseqa-hoover-nov'); const json = await p.locator('script[type="application/ld+json"]').allTextContents(); assert.ok(json.some(s => s.includes('2026-11-14T01:30:00')));
  assert.match(await p.locator('main').innerText(), /8:30\s*PM/i);
  await p.goto(base + '/calendar'); await p.getByRole('button', { name: 'Next month', exact: true }).waitFor({ state: 'visible' });
  const day = p.getByRole('button', { name: /^Friday, November 13, 2026/ });
  await day.click(); const chip = day.locator('..').getByRole('button', { name: /Hoover St November Social QA/ }); assert.equal(await chip.count(), 1); await chip.click();
  const dialog = p.getByRole('dialog', { name: 'Hoover St November Social QA', exact: true }); await dialog.waitFor(); assert.match(await dialog.innerText(), /8:30\s*PM/i);
  await p.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
  assert.ok(await chip.evaluate(e => e === document.activeElement));
  await p.close(); const page = await login(c, 'owner', '/organizer/events/releaseqa-hoover-nov/edit');
  assert.match(await page.getByRole('button', { name: 'Start Date', exact: true }).innerText(), /November 13/); assert.equal((await page.getByRole('combobox', { name: 'Start hour' }).innerText()).trim(), '8'); assert.equal((await page.getByRole('combobox', { name: 'Start AM/PM' }).innerText()).trim(), 'PM'); results.timezone.push({ timezone: tz, status: 'PASS' }); await c.close();
});
await check('Keyboard date-picker and mobile-menu focus return', async () => {
  const c = await context({ viewport: { width: 390, height: 1000 } }); const page = await login(c, 'owner', '/organizer/events/releaseqa-hoover-nov/edit');
  const menu = page.getByRole('button', { name: 'Open menu', exact: true }); await menu.focus(); await menu.press('Enter'); const nav = page.getByRole('dialog', { name: 'Navigation menu', exact: true }); await nav.waitFor(); await page.keyboard.press('Escape'); await nav.waitFor({ state: 'hidden' }); assert.ok(await menu.evaluate(e => e === document.activeElement));
  const start = page.getByRole('button', { name: 'Start Date', exact: true }); await start.focus(); await start.press('Enter'); const picker = page.getByRole('dialog', { name: 'Choose start date', exact: true }); await picker.waitFor(); await page.keyboard.press('Escape'); await picker.waitFor({ state: 'hidden' }); assert.ok(await start.evaluate(e => e === document.activeElement)); await c.close();
});
await check('HTTPS production indexing and permanent www redirect remain intact', async () => {
  const robots = await fetch('https://michigandance.life/robots.txt'); assert.equal(robots.status, 200); const text = await robots.text(); assert.ok(!/Disallow:\s*\/\s*$/m.test(text));
  const redirect = await fetch('https://www.michigandance.life/', { redirect: 'manual' }); assert.ok([301, 308].includes(redirect.status)); assert.equal(new URL(redirect.headers.get('location')).hostname, 'michigandance.life');
});
const publicPaths = ['/', '/calendar', '/events', '/event/releaseqa-hoover-nov', '/events/city/royal-oak', '/events/style/salsa', '/login', '/register', '/forgot-password', '/reset-password', '/privacy', '/terms', '/contact', '/unsubscribe'];
for (const width of [1440, 390]) {
  const c = await context({ viewport: { width, height: 1000 } }); const page = await c.newPage();
  for (const path of publicPaths) await check(`axe WCAG 2.1 AA ${width}px ${path}`, async () => {
    const response = await page.goto(base + path); assert.ok(response.status() < 400); if (path === '/calendar' || (path === '/' && width >= 768)) await page.getByRole('button', { name: 'Next month', exact: true }).waitFor({ state: 'visible' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(700); await page.addScriptTag({ path: axePath });
    const report = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    const violations = report.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target, summary: n.failureSummary })) })); results.accessibility.push({ width, path, violations, incomplete: report.incomplete.map(v => v.id) }); assert.equal(violations.length, 0, JSON.stringify(violations).slice(0, 2000));
    if (path === '/calendar') {
      await page.getByRole('button', { name: 'Week', exact: true }).click(); await page.getByRole('button', { name: 'Next week', exact: true }).waitFor(); await page.waitForTimeout(700);
      const weekReport = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
      const weekViolations = weekReport.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target, summary: n.failureSummary })) }));
      results.accessibility.push({ width, path: '/calendar (week)', violations: weekViolations, incomplete: weekReport.incomplete.map(v => v.id) }); assert.equal(weekViolations.length, 0, JSON.stringify(weekViolations).slice(0, 2000));
    }
  }); await c.close();
  const authContext = await context({ viewport: { width, height: 1000 } }); const authPage = await login(authContext, 'admin', '/admin');
  for (const path of ['/admin', '/organizer/events', '/organizer/events/new', '/organizer/events/releaseqa-hoover-nov/edit', '/profile']) await check(`authenticated axe ${width}px ${path}`, async () => {
    await authPage.goto(base + path); await authPage.evaluate(() => document.fonts.ready); await authPage.waitForTimeout(700); await authPage.addScriptTag({ path: axePath }); const report = await authPage.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })); const violations = report.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target, summary: n.failureSummary })) })); results.accessibility.push({ width, path, violations, incomplete: report.incomplete.map(v => v.id) }); assert.equal(violations.length, 0, JSON.stringify(violations).slice(0, 2000));
  }); await authContext.close();
}
await check('Calendar layout and interaction stay within all nine responsive widths', async () => {
  const c = await context(); const page = await c.newPage(); await page.goto(base + '/calendar');
  for (const width of [1920, 1440, 1280, 1024, 800, 768, 390, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    if (width < 768) await page.locator('button[class~="min-h-[52px]"]').first().waitFor(); else await page.locator('div[class~="min-h-[76px]"]').first().waitFor();
    const metrics = await page.evaluate(() => ({ width: innerWidth, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, desktopAgendas: document.querySelectorAll('#selected-date-heading').length }));
    assert.equal(metrics.overflow, 0); assert.equal(metrics.desktopAgendas, width < 768 ? 0 : 1);
    console.log('QA_LAYOUT ' + JSON.stringify(metrics));
  }
  await page.setViewportSize({ width: 390, height: 1000 }); await page.locator('button[class~="min-h-[52px]"]').first().waitFor(); await page.screenshot({ path: 'public/qa-calendar-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.locator('div[class~="min-h-[76px]"]').first().waitFor(); await page.screenshot({ path: 'public/qa-calendar-desktop.png', fullPage: true }); await c.close();
});
await check('Public internal links, sitemap, canonicals and unknown-page behavior', async () => {
  const c = await context(); const paths = new Set(publicPaths); const sitemap = await (await c.request.get(base + '/sitemap.xml')).text();
  for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) paths.add(new URL(match[1]).pathname);
  const broken = []; const queue = [...paths].filter(path => !path.startsWith('/api/')); const visited = new Set();
  for (let i = 0; i < queue.length && i < 200; i++) {
    const path = queue[i]; if (visited.has(path)) continue; visited.add(path); const r = await c.request.get(base + path);
    if (r.status() >= 400) { broken.push({ path, status: r.status() }); continue; }
    const html = await r.text(); if (['/', '/calendar', '/events', '/event/releaseqa-hoover-nov'].includes(path)) { assert.match(html, /<title>[^<]+<\/title>/); assert.match(html, /rel="canonical"/); assert.match(html, /property="og:image"/); }
    for (const match of html.matchAll(/href="(\/[^"#]*)"/g)) { const url = new URL(match[1].replaceAll('&amp;', '&'), base); if (!/^\/(?:api|_next|admin|organizer|profile)/.test(url.pathname) && !/\.[a-z0-9]{2,5}$/i.test(url.pathname) && !visited.has(url.pathname) && !queue.includes(url.pathname)) queue.push(url.pathname); }
  }
  assert.deepEqual(broken, []); assert.equal((await c.request.get(base + '/releaseqa-this-route-does-not-exist')).status(), 404); console.log('QA_CRAWL ' + JSON.stringify({ visited: visited.size, broken })); await c.close();
});
await check('Recurring social cards use the resolved stale-link occurrence and render valid distinct PNGs', async () => {
  const c = await context(); const page = await c.newPage(); const hashes = [];
  for (const [requested, expected] of [['2026-11-21T17:00:00.000Z', '2026-11-22T02:00:00.000Z'], ['2026-12-19T17:00:00.000Z', '2026-12-20T02:00:00.000Z']]) {
    await page.goto(`${base}/event/releaseqa-share-series?instance=${encodeURIComponent(requested)}`);
    const imageUrl = new URL(await page.locator('meta[property="og:image"]').getAttribute('content')); assert.ok(imageUrl.pathname.endsWith('/share-image')); assert.equal(imageUrl.searchParams.get('instance'), expected);
    assert.ok((await page.locator('meta[property="og:url"]').getAttribute('content')).includes(encodeURIComponent(expected)));
    const response = await c.request.get(base + imageUrl.pathname + imageUrl.search); assert.equal(response.status(), 200); assert.match(response.headers()['content-type'], /image\/png/);
    const buffer = await response.body(); assert.equal(buffer.readUInt32BE(16), 1200); assert.equal(buffer.readUInt32BE(20), 630); hashes.push(createHash('sha256').update(buffer).digest('hex'));
    if (expected.includes('12-20')) await writeFile('public/qa-social-december.png', buffer);
  }
  assert.notEqual(hashes[0], hashes[1]); assert.equal((await c.request.get(base + '/event/releaseqa-absent/share-image')).status(), 404); await c.close();
});
await check('Real password-reset UI rejects replay and immediately revokes the previous authenticated session', async () => {
  const oldContext = await context(); await login(oldContext, 'recovery', '/profile');
  const token = randomBytes(32).toString('hex'); const nextPassword = 'Synthetic-Recovered-Only-2026!';
  await db.verificationToken.create({ data: { identifier: `password-reset:${ids.recovery}@example.invalid`, token: createHash('sha256').update(token).digest('hex'), expires: new Date(Date.now() + 600000) } });
  const fresh = await context(); const page = await fresh.newPage(); await page.goto(`${base}/reset-password?token=${token}`);
  await page.getByLabel('New password', { exact: true }).fill(nextPassword); await page.getByLabel('Confirm password', { exact: true }).fill(nextPassword);
  const changed = page.waitForResponse(r => r.url().endsWith('/api/auth/reset-password') && r.request().method() === 'POST'); await page.getByRole('button', { name: 'Reset password', exact: true }).click(); assert.equal((await changed).status(), 200); await page.waitForURL(`${base}/login`);
  assert.equal((await oldContext.request.patch(base + '/api/events/releaseqa-hoover-nov', { data: { title: 'Revoked reset session' } })).status(), 401);
  assert.ok(!(await (await oldContext.request.get(base + '/api/auth/session')).json())?.user);
  assert.equal((await fresh.request.post(base + '/api/auth/reset-password', { data: { token, password: 'Synthetic-replay!' } })).status(), 400);
  await page.goto(base + '/login?callbackUrl=%2Fprofile'); await page.getByLabel('Email', { exact: true }).fill(`${ids.recovery}@example.invalid`); await page.getByLabel('Password', { exact: true }).fill(password); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await page.getByText('Invalid email or password').waitFor();
  await page.getByLabel('Password', { exact: true }).fill(nextPassword); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await page.waitForURL(base + '/profile');
  await oldContext.close(); await fresh.close();
});
await owner.close(); await browser.close();
if (process.env.MDL_AUDIT_PERFORMANCE === '1') { const { measurePerformance } = await import('./performance.mjs'); results.performance = await measurePerformance(chromiumBinary, base); }
server.kill('SIGTERM'); await db.$disconnect();
await mkdir('public', { recursive: true }); await writeFile('public/qa-release-report.json', JSON.stringify(results, null, 2));
for (const row of results.accessibility) if (row.violations.length) console.log('QA_AXE ' + JSON.stringify(row));
console.log('QA_TIMEZONES ' + JSON.stringify(results.timezone));
console.log(`QA_BROWSER_TOTAL passed=${results.checks.filter(c => c.status === 'PASS').length} failed=${results.checks.filter(c => c.status === 'FAIL').length} skipped=0`);
// Keep the isolated preview available even when evidence reveals defects.
// The release verdict uses every failed result, never just deployment READY.
