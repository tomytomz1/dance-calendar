import { describe, expect, it } from 'vitest';
import { fromSiteWallClock, toSiteWallClock, formatInSiteTimeZone } from '@/lib/timezone';
for (const zone of ['America/Detroit','UTC','America/Los_Angeles','Asia/Tokyo']) {
  describe(zone, () => {
    it('round-trips Hoover November fields without changing the instant', () => {
      const prev=process.env.TZ; process.env.TZ=zone;
      try {
        const original=new Date('2026-11-14T01:30:00Z');
        const day=toSiteWallClock(original);
        expect(formatInSiteTimeZone(original,'yyyy-MM-dd HH:mm')).toBe('2026-11-13 20:30');
        expect(fromSiteWallClock(day,'20:30').toISOString()).toBe(original.toISOString());
        expect(fromSiteWallClock(new Date(2026,6,10),'20:30').toISOString()).toBe('2026-07-11T00:30:00.000Z');
      } finally { if(prev===undefined) delete process.env.TZ; else process.env.TZ=prev; }
    });
    it('rejects a spring DST gap and chooses the first autumn repeated time', () => {
      const prev=process.env.TZ;process.env.TZ=zone;
      try {
        expect(()=>fromSiteWallClock(new Date(2026,2,8),'02:30')).toThrow(/does not exist/);
        expect(fromSiteWallClock(new Date(2026,10,1),'01:30').toISOString()).toBe('2026-11-01T05:30:00.000Z');
        expect(()=>fromSiteWallClock(new Date(2026,2,8),'25:30')).toThrow();
      } finally { if(prev===undefined) delete process.env.TZ; else process.env.TZ=prev; }
    });
  });
}
