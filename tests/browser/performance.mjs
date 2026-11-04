import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

/** Repeatable lab measurements; synthetic candidate content differs from production. */
export async function measurePerformance(chromiumBinary, base) {
  const { default: lighthouse } = await import('file:///tmp/mdl-qa-browser/node_modules/lighthouse/core/index.js');
  const { default: desktop } = await import('file:///tmp/mdl-qa-browser/node_modules/lighthouse/core/config/desktop-config.js');
  const child = spawn(await chromiumBinary.executablePath(), [...chromiumBinary.args.filter(a => !a.startsWith('--remote-debugging') && a !== '--single-process'), '--remote-debugging-port=9222', '--user-data-dir=/tmp/mdl-lighthouse-profile', 'about:blank'], { stdio: 'ignore' });
  try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch('http://127.0.0.1:9222/json/version')).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
    const rows = [];
    const routes = ['/', '/calendar', '/events', '/event/releaseqa-hoover-nov'];
    for (const formFactor of ['mobile', 'desktop']) for (const path of routes) for (let run = 1; run <= (formFactor === 'mobile' ? 3 : 1); run++) {
      const { lhr } = await lighthouse(base + path, { port: 9222, logLevel: 'error', onlyCategories: ['performance'], output: 'json', maxWaitForLoad: 20000, blockedUrlPatterns: ['*google-analytics.com*', '*googletagmanager.com*', '*plausible.io*', '*/_vercel/insights/*'] }, formFactor === 'desktop' ? desktop : undefined);
      const a = lhr.audits;
      const row = { scope: 'isolated-production-build', path, formFactor, run, score: Math.round(lhr.categories.performance.score * 100), LCP: a['largest-contentful-paint'].numericValue, CLS: a['cumulative-layout-shift'].numericValue, TBT: a['total-blocking-time'].numericValue, TTFB: a['server-response-time']?.numericValue, javascriptBytes: a['network-requests']?.details?.items?.filter(r => r.resourceType === 'Script').reduce((n, r) => n + (r.transferSize || 0), 0), runtimeError: lhr.runtimeError ?? null, warnings: lhr.runWarnings };
      rows.push(row); console.log('QA_LIGHTHOUSE ' + JSON.stringify(row));
    }
    // Production comparison is GET-only, without authenticated cookies or form actions.
    for (const path of ['/', '/calendar', '/events', '/event/hoover-st-november-social-2']) {
      try {
        const { lhr } = await lighthouse('https://michigandance.life' + path, { port: 9222, logLevel: 'error', onlyCategories: ['performance'], output: 'json', maxWaitForLoad: 20000, blockedUrlPatterns: ['*google-analytics.com*', '*googletagmanager.com*', '*plausible.io*', '*/_vercel/insights/*'] });
        const a = lhr.audits; const row = { scope: 'current-production', path, formFactor: 'mobile', run: 1, score: Math.round(lhr.categories.performance.score * 100), LCP: a['largest-contentful-paint'].numericValue, CLS: a['cumulative-layout-shift'].numericValue, TBT: a['total-blocking-time'].numericValue, runtimeError: lhr.runtimeError ?? null }; rows.push(row); console.log('QA_LIGHTHOUSE ' + JSON.stringify(row));
      } catch (error) { rows.push({ scope: 'current-production', path, error: error.message }); }
    }
    await mkdir('public', { recursive: true }); await writeFile('public/qa-performance-report.json', JSON.stringify(rows, null, 2)); return rows;
  } finally { child.kill('SIGTERM'); }
}
