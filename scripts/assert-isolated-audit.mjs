import { PrismaClient } from '@prisma/client';

const expectedHost = /^ep-divine-mud-aipcfj3f(?:-pooler)?\.c-4\.us-east-1\.aws\.neon\.tech$/;
for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
  const url = new URL(process.env[key] || 'http://invalid');
  if (process.env.MDL_ISOLATED_AUDIT !== 'pr5-release-2026-11-04' ||
      process.env.VERCEL_ENV !== 'preview' || !expectedHost.test(url.hostname) ||
      url.pathname !== '/audit_pr5_release') throw new Error('Refusing non-isolated audit environment');
}
if (process.env.RESEND_API_KEY || process.env.GOOGLE_CLIENT_SECRET) throw new Error('Outbound providers must be disabled for isolated audit');
const db = new PrismaClient();
try {
  const [identity] = await db.$queryRaw`SELECT current_database() AS name`;
  if (identity.name !== 'audit_pr5_release') throw new Error('Unexpected actual database');
  console.log('ISOLATION VERIFIED: audit_pr5_release on dedicated QA branch; outbound providers disabled.');
} finally { await db.$disconnect(); }
