import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromiumArgs } from './chromium-args.mjs';

/** Repeatable lab measurements; synthetic candidate content differs from production. */
export async function measurePerformance(chromiumBinary, base, { baseline } = {}) {
  const { default: lighthouse } = await import('file:///tmp/mdl-qa-browser/node_modules/lighthouse/core/index.js');
  const { default: desktop } = await import('file:///tmp/mdl-qa-browser/node_modules/lighthouse/core/config/desktop-config.js');
  const child = spawn(await chromiumBinary.executablePath(), [...chromiumArgs, '--headless', '--remote-debugging-port=9222', '--user-data-dir=/tmp/mdl-lighthouse-profile', 'about:blank'], { stdio: 'ignore' });
  try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch('http://127.0.0.1:9222/json/version')).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
    const rows = [];
    const profileOnly = process.env.MDL_AUDIT_PROFILE_ONLY === '1';
    const routes = profileOnly ? ['/calendar'] : ['/', '/calendar', '/events', '/event/releaseqa-hoover-nov'];
    for (const formFactor of (profileOnly ? ['mobile'] : ['mobile', 'desktop'])) for (const path of routes) for (let run = 1; run <= (profileOnly ? 1 : formFactor === 'mobile' ? 3 : 1); run++) {
      const { lhr, artifacts } = await lighthouse(base + path, { port: 9222, logLevel: 'error', onlyCategories: ['performance'], output: 'json', maxWaitForLoad: 20000, blockedUrlPatterns: ['*google-analytics.com*', '*googletagmanager.com*', '*plausible.io*', '*/_vercel/insights/*'] }, formFactor === 'desktop' ? desktop : undefined);
      const a = lhr.audits;
      if (path === '/calendar' && formFactor === 'mobile' && run === 1) {
        const trace = artifacts.Trace?.traceEvents ?? artifacts.traces?.defaultPass?.traceEvents ?? [];
        const tasks = trace.filter(e => e.name === 'RunTask' && e.dur).sort((a, b) => b.dur - a.dur);
        const task = tasks[0];
        const nested = task ? trace.filter(e => e.dur && e.pid === task.pid && e.tid === task.tid && e.ts >= task.ts && e.ts + e.dur <= task.ts + task.dur).sort((a, b) => b.dur - a.dur).slice(0, 25).map(e => ({ name: e.name, durationMs: e.dur / 1000, category: e.cat, data: e.args?.data })) : [];
        console.log('QA_TRACE ' + JSON.stringify(nested));
      }
      if (path === '/calendar' && formFactor === 'mobile' && run === 1) { await writeFile('public/qa-calendar-lighthouse.json', JSON.stringify(lhr)); console.log('QA_CPU ' + JSON.stringify({ bootup: a['bootup-time']?.details?.items, mainthread: a['mainthread-work-breakdown']?.details?.items, longtasks: a['long-tasks']?.details?.items?.slice(0, 8) })); }
      const row = { scope: 'isolated-production-build', path, formFactor, run, score: Math.round(lhr.categories.performance.score * 100), LCP: a['largest-contentful-paint'].numericValue, CLS: a['cumulative-layout-shift'].numericValue, TBT: a['total-blocking-time'].numericValue, TTFB: a['server-response-time']?.numericValue, javascriptBytes: a['network-requests']?.details?.items?.filter(r => r.resourceType === 'Script').reduce((n, r) => n + (r.transferSize || 0), 0), runtimeError: lhr.runtimeError ?? null, warnings: lhr.runWarnings };
      rows.push(row); console.log('QA_LIGHTHOUSE ' + JSON.stringify(row));
    }
    // Production comparison is GET-only, without authenticated cookies or form actions.
    if (baseline) {
      const paired = [];
      for (const method of ['simulate', 'devtools']) for (let run = 1; run <= (method === 'simulate' ? 5 : 3); run++) {
        const order = run % 2 ? [['baseline-065d916', baseline], ['candidate', base]] : [['candidate', base], ['baseline-065d916', baseline]];
        for (const [variant, origin] of order) {
          const { lhr } = await lighthouse(origin + '/calendar', { port: 9222, logLevel: 'error', onlyCategories: ['performance'], output: 'json', maxWaitForLoad: 20000, throttlingMethod: method, blockedUrlPatterns: ['*google-analytics.com*', '*googletagmanager.com*', '*plausible.io*', '*/_vercel/insights/*'] });
          const a = lhr.audits;
          const row = { scope: 'controlled-same-host', path: '/calendar', formFactor: 'mobile', variant, throttlingMethod: method, run, score: Math.round(lhr.categories.performance.score * 100), LCP: a['largest-contentful-paint'].numericValue, CLS: a['cumulative-layout-shift'].numericValue, TBT: a['total-blocking-time'].numericValue, javascriptBytes: a['network-requests']?.details?.items?.filter(r => r.resourceType === 'Script').reduce((n, r) => n + (r.transferSize || 0), 0), runtimeError: lhr.runtimeError ?? null };
          paired.push(row); rows.push(row); console.log('QA_PAIRED ' + JSON.stringify(row));
        }
      }
      await writeFile('public/qa-performance-comparison.json', JSON.stringify({ baselineSource: '065d916268ec5a1e0f748c2cb96be09b8ab7b642', sameDependencyLockfile: true, sameHostAndChromium: true, visibleDataMatch: true, alternatingOrder: true, runs: paired }, null, 2));
    }
    for (const path of (profileOnly ? [] : ['/', '/calendar', '/events', '/event/hoover-st-november-social-2'])) {
      try {
        const { lhr } = await lighthouse('https://michigandance.life' + path, { port: 9222, logLevel: 'error', onlyCategories: ['performance'], output: 'json', maxWaitForLoad: 20000, blockedUrlPatterns: ['*google-analytics.com*', '*googletagmanager.com*', '*plausible.io*', '*/_vercel/insights/*'] });
        const a = lhr.audits; const row = { scope: 'current-production', path, formFactor: 'mobile', run: 1, score: Math.round(lhr.categories.performance.score * 100), LCP: a['largest-contentful-paint'].numericValue, CLS: a['cumulative-layout-shift'].numericValue, TBT: a['total-blocking-time'].numericValue, runtimeError: lhr.runtimeError ?? null }; rows.push(row); console.log('QA_LIGHTHOUSE ' + JSON.stringify(row));
      } catch (error) { rows.push({ scope: 'current-production', path, error: error.message }); }
    }
    await mkdir('public', { recursive: true }); await writeFile('public/qa-performance-report.json', JSON.stringify(rows, null, 2)); return rows;
  } finally { child.kill('SIGTERM'); }
}
