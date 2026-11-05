import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ claimed: false, updates: 0 }));
vi.mock('@/lib/auth', () => ({ hashPassword: async () => 'synthetic-password-hash' }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: () => ({ allowed: true }), getClientIp: () => 'isolated' }));
vi.mock('@/lib/prisma', () => {
  const db = {
    verificationToken: {
      findFirst: async () => state.claimed ? null : ({ identifier: 'password-reset:synthetic@example.invalid', token: 'hashed', expires: new Date('2099-01-01') }),
      deleteMany: async () => { const count = state.claimed ? 0 : 1; state.claimed = true; return { count }; },
    },
    user: { findFirst: async () => ({ id: 'synthetic', password: 'old-hash' }), update: async () => { state.updates++; } },
    session: { deleteMany: async () => ({ count: 0 }) },
    $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => fn(db),
  };
  return { prisma: db };
});
import { POST } from '@/app/api/auth/reset-password/route';
beforeEach(() => { state.claimed = false; state.updates = 0; });
it('allows exactly one concurrent password reset for a single token', async () => {
  const request = () => new Request('https://isolated.invalid/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'synthetic-token', password: 'Synthetic-new-password!' }) });
  const responses = await Promise.all([POST(request()), POST(request())]);
  expect(responses.map(r => r.status).sort()).toEqual([200, 400]);
  expect(state.updates).toBe(1);
});
