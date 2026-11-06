import { afterEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('resend', () => ({ Resend: class { emails = { send: mock.send }; } }));
import { generatePasswordResetEmail, generateWelcomeEmail, generateNewEventEmail, sendEmail } from '@/lib/email';
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it('escapes names and event text inside email HTML', () => {
  const attack = '<img src=x onerror="attack()">';
  const messages = [generatePasswordResetEmail(attack, 'https://isolated.invalid/reset?token=synthetic'), generateWelcomeEmail(attack, false), generateNewEventEmail(attack, 'Nov 13', '9 PM', attack, attack, [attack], 'https://isolated.invalid/event', 'https://isolated.invalid')];
  for (const { html } of messages) { expect(html).not.toContain(attack); expect(html).toContain('&lt;img'); }
});
it('does not invoke the delivery SDK when email is unconfigured', async () => {
  vi.stubEnv('RESEND_API_KEY', ''); expect((await sendEmail({ to: 'qa@example.invalid', subject: 'Synthetic', html: 'Synthetic' })).success).toBe(false); expect(mock.send).not.toHaveBeenCalled();
});
it('handles SDK acceptance without sending a real message', async () => {
  vi.stubEnv('RESEND_API_KEY', 'synthetic-mocked-key'); mock.send.mockResolvedValue({ data: { id: 'mock-message' }, error: null });
  expect(await sendEmail({ to: 'qa@example.invalid', subject: 'Synthetic', html: 'Synthetic' })).toEqual({ success: true, messageId: 'mock-message' });
});
it('reports a mocked delivery failure rather than false success', async () => {
  vi.stubEnv('RESEND_API_KEY', 'synthetic-mocked-key'); mock.send.mockResolvedValue({ data: null, error: { message: 'Synthetic rejection' } });
  expect((await sendEmail({ to: 'qa@example.invalid', subject: 'Synthetic', html: 'Synthetic' })).success).toBe(false);
});
