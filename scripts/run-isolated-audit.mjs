import { execFileSync } from 'node:child_process';
await import('./assert-isolated-audit.mjs');
const run = (program, args) => execFileSync(program, args, { stdio: 'inherit', env: process.env });
run(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate']);
run(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.integration.config.ts']);
run(process.execPath, ['scripts/prepare-isolated-fixtures.mjs']);
run(process.execPath, ['node_modules/next/dist/bin/next', 'build']);
run('npm', ['install', '--prefix', '/tmp/mdl-qa-browser', '--no-save', '--package-lock=false', '@sparticuz/chromium@153.0.0', 'playwright-core@1.64.1', 'axe-core@4.14.0', 'lighthouse@13.6.0']);
run(process.execPath, ['tests/browser/release.mjs']);
