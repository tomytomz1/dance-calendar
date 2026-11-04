import { beforeAll, describe, expect, it } from 'vitest';
import { generateRecurrenceInstances } from '@/lib/recurrence';
import { resolveEventOccurrence } from '@/lib/event-detail';
import { pinProcessTimeZone, formatInSiteTimeZone } from '@/lib/timezone';
beforeAll(pinProcessTimeZone);
const start = new Date('2026-01-31T02:00:00Z'); // Jan 30, 9 PM
const end = new Date('2026-01-31T07:00:00Z');
const label = (d: Date) => formatInSiteTimeZone(d, 'yyyy-MM-dd HH:mm');
describe('release audit recurrence boundaries', () => {
  it('includes the evening of a date-only until value', () => {
    const rows = generateRecurrenceInstances(start,end,{frequency:'MONTHLY',interval:1,until:new Date('2026-03-30T04:00:00Z')});
    expect(rows.map(r=>label(r.startTime))).toContain('2026-03-30 21:00');
  });
  it('honours weekly interval with selected weekdays', () => {
    const rows = generateRecurrenceInstances(start,end,{frequency:'WEEKLY',interval:2,daysOfWeek:[5],count:3});
    expect(rows.map(r=>label(r.startTime))).toEqual(['2026-01-30 21:00','2026-02-13 21:00','2026-02-27 21:00']);
  });
  it('anchors monthly day after a short month', () => {
    const rows = generateRecurrenceInstances(new Date('2026-02-01T02:00:00Z'),new Date('2026-02-01T07:00:00Z'),{frequency:'MONTHLY',interval:1,count:3});
    expect(rows.map(r=>label(r.startTime))).toEqual(['2026-01-31 21:00','2026-02-28 21:00','2026-03-31 21:00']);
  });
  it('does not impose a one-year limit on an explicit count', () => {
    expect(generateRecurrenceInstances(start,end,{frequency:'MONTHLY',interval:1,count:18})).toHaveLength(18);
  });
  it('does not revive an expired rule ending before its start', () => {
    expect(generateRecurrenceInstances(start,end,{frequency:'DAILY',interval:1,until:new Date('2026-01-01T05:00:00Z')})).toEqual([]);
  });
  it('deduplicates overlapping last and fifth weekday patterns', () => {
    const rows=generateRecurrenceInstances(start,end,{frequency:'MONTHLY',interval:1,monthlyPattern:'BY_WEEKDAY',monthlyDayOfWeek:5,monthlyWeeks:[5,-1],count:2});
    expect(new Set(rows.map(r=>+r.startTime)).size).toBe(rows.length);
  });
  it('does not fabricate an occurrence for a recurring event without a rule', () => {
    const row=resolveEventOccurrence({startTime:start,endTime:end,isRecurring:true,recurrenceRule:null},'2030-05-01T12:00:00Z');
    expect(row.start).toEqual(start);
    expect(row.isSpecificInstance).toBe(false);
  });
});
describe('release audit occurrence URLs and leap dates', () => {
  const source={startTime:start,endTime:end,isRecurring:true,recurrenceRule:{frequency:'MONTHLY' as const,interval:1,daysOfWeek:[],until:null,count:null,monthlyPattern:'BY_DATE' as const,monthlyDayOfWeek:null,monthlyWeeks:[]}};
  const now=new Date('2026-11-04T16:00:00Z');
  it('flags invalid timestamps instead of silently hiding the fallback',()=>{
    const r=resolveEventOccurrence(source,'not-a-date',now);expect(r.isSpecificInstance).toBe(false);expect(r.instanceUnavailable).toBe(true);
  });
  it('flags a requested date removed from the series',()=>{
    const r=resolveEventOccurrence(source,'2026-11-12T02:00:00Z',now);expect(r.instanceUnavailable).toBe(true);expect(r.isSpecificInstance).toBe(false);
  });
  it('preserves a matching historical occurrence',()=>{
    const r=resolveEventOccurrence(source,'2026-03-31T01:00:00Z',now);expect(label(r.start)).toBe('2026-03-30 21:00');expect(r.isSpecificInstance).toBe(true);
  });
  it('resolves an occurrence beyond the ordinary thirteen-month horizon',()=>{
    const r=resolveEventOccurrence(source,'2028-05-31T01:00:00Z',now);expect(label(r.start)).toBe('2028-05-30 21:00');expect(r.isSpecificInstance).toBe(true);
  });
  it('does not change a non-recurring event based on an instance parameter',()=>{
    const r=resolveEventOccurrence({...source,isRecurring:false},'2030-05-01T12:00:00Z',now);expect(r.start).toEqual(start);expect(r.instanceUnavailable).toBe(true);
  });
  it('anchors the 31st through leap February',()=>{
    const rows=generateRecurrenceInstances(new Date('2028-02-01T02:00:00Z'),new Date('2028-02-01T07:00:00Z'),{frequency:'MONTHLY',interval:1,count:3});
    expect(rows.map(r=>label(r.startTime))).toEqual(['2028-01-31 21:00','2028-02-29 21:00','2028-03-31 21:00']);
  });
});
