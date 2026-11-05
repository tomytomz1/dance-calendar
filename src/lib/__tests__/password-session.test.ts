import { beforeEach, expect, it, vi } from 'vitest';
import type { NextAuthConfig } from 'next-auth';
const state = vi.hoisted(() => ({ config: null as NextAuthConfig | null, password: 'synthetic-original-hash' as string | null }));
vi.mock('next-auth', () => ({ default: (config: NextAuthConfig) => { state.config = config; return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }; } }));
vi.mock('@auth/prisma-adapter', () => ({ PrismaAdapter: () => ({}) }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: async () => ({ id: 'synthetic', role: 'ORGANIZER', verified: true, password: state.password }) } } }));
vi.mock('@/lib/subscription-link', () => ({ linkSubscriptionToUser: vi.fn() }));
import '@/lib/auth';
type JwtArgs = Parameters<NonNullable<NonNullable<NextAuthConfig['callbacks']>['jwt']>>[0];
const runJwt = async (token: object, signIn = false) => state.config!.callbacks!.jwt!({ token, ...(signIn ? { user: { id: 'synthetic', role: 'ORGANIZER', verified: true } } : {}) } as JwtArgs);
beforeEach(() => { state.password = 'synthetic-original-hash'; });
it('invalidates a signed-in JWT immediately after its password changes', async () => {
  const issued = await runJwt({}, true);
  state.password = 'synthetic-replacement-hash';
  expect(await runJwt(issued!)).toBeNull();
});
it('retains the current credential session and refreshes role information', async () => {
  const issued = await runJwt({}, true);
  expect((await runJwt(issued!))?.role).toBe('ORGANIZER');
});
it('keeps passwordless OAuth sessions valid until the credential state changes', async () => {
  state.password = null;
  const issued = await runJwt({}, true);
  expect(await runJwt(issued!)).not.toBeNull();
  state.password = 'new-password-hash';
  expect(await runJwt(issued!)).toBeNull();
});
it('fails closed for old JWTs without a credential version', async () => {
  expect(await runJwt({ id: 'synthetic' })).toBeNull();
});
