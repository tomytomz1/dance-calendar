import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ token: vi.fn() }));
vi.mock('next-auth/jwt', () => ({ getToken: mocks.token }));
import { proxy } from '@/proxy';
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it('uses the same current-secret precedence as Auth.js v5', async () => {
  vi.stubEnv('AUTH_SECRET', 'current-synthetic-secret'); vi.stubEnv('NEXTAUTH_SECRET', 'legacy-synthetic-secret'); mocks.token.mockResolvedValue({ id: 'synthetic' });
  expect((await proxy(new NextRequest('https://isolated.invalid/organizer/events'))).status).toBe(200);
  expect(mocks.token).toHaveBeenCalledWith(expect.objectContaining({ secret: 'current-synthetic-secret', cookieName: '__Secure-authjs.session-token' }));
});
it('supports the legacy secret and HTTP cookie name in isolated local testing', async () => {
  vi.stubEnv('AUTH_SECRET', undefined); vi.stubEnv('NEXTAUTH_SECRET', 'legacy-synthetic-secret'); mocks.token.mockResolvedValue({ id: 'synthetic' });
  expect((await proxy(new NextRequest('http://localhost/organizer/events'))).status).toBe(200);
  expect(mocks.token).toHaveBeenCalledWith(expect.objectContaining({ secret: 'legacy-synthetic-secret', cookieName: 'authjs.session-token' }));
});
it('fails closed when protected-route authentication is unconfigured', async () => {
  vi.stubEnv('AUTH_SECRET', undefined); vi.stubEnv('NEXTAUTH_SECRET', undefined);
  expect((await proxy(new NextRequest('https://isolated.invalid/admin'))).status).toBe(503); expect(mocks.token).not.toHaveBeenCalled();
});
