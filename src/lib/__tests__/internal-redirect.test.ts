import { expect, it } from 'vitest';
import { internalRedirectPath } from '@/lib/internal-redirect';
it.each(['//attacker.invalid', '/\t/attacker.invalid', '/\n/attacker.invalid', '/\r/attacker.invalid', '/\\attacker.invalid', 'https://attacker.invalid', 'javascript:alert(1)'])('rejects browser-normalized external redirect %j', value => {
  expect(internalRedirectPath(value)).toBe('/');
});
it.each(['/organizer/events', '/calendar?city=Royal%20Oak#events', '/events?ticket=https://example.invalid'])('retains internal destination %s', value => {
  expect(internalRedirectPath(value)).toBe(value);
});
