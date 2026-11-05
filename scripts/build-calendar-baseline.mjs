import { readFile, writeFile, mkdir, rename, copyFile, symlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
await import('./assert-isolated-audit.mjs');

// The fixture is public source from the last audited release. Both
// builds use this checkout, dependency lockfile, environment and isolated DB.
const fixture = JSON.parse(await readFile('tests/fixtures/calendar-performance-baseline.json', 'utf8'));
const allowed = [...['event-calendar', 'month-view', 'week-view', 'mobile-month-view', 'mobile-week-view'].map(name => `src/components/calendar/${name}.tsx`), 'src/components/layout/header.tsx'];
if (fixture.baselineReleaseSha !== '065d916268ec5a1e0f748c2cb96be09b8ab7b642' || Object.keys(fixture.files).sort().join() !== [...allowed].sort().join()) throw new Error('Unexpected performance baseline');
const candidate = new Map();
for (const file of allowed) {
  const saved = fixture.files[file];
  if (createHash('sha256').update(saved.content).digest('hex') !== saved.sha256) throw new Error('Baseline digest mismatch');
  candidate.set(file, await readFile(file, 'utf8'));
}
try {
  for (const file of allowed) await writeFile(file, fixture.files[file].content);
  execFileSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], { stdio: 'inherit', env: process.env });
  await mkdir('.audit/baseline', { recursive: true });
  await rename('.next', '.audit/baseline/.next');
  for (const file of ['next.config.ts', 'package.json']) await copyFile(file, `.audit/baseline/${file}`);
  await symlink(path.resolve('node_modules'), '.audit/baseline/node_modules', 'dir');
  await symlink(path.resolve('public'), '.audit/baseline/public', 'dir');
  console.log('QA_BASELINE_BUILD source=065d916 same-dependencies same-isolated-database');
} finally {
  for (const [file, content] of candidate) await writeFile(file, content);
}
