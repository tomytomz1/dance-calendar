import { describe, expect, it } from 'vitest';
import { createEventSchema, recurrenceSchema, updateEventSchema } from '@/lib/event-validation';
const valid={title:'Test event',danceStyles:['Salsa'],venue:'Test venue',address:'123 Test Street',city:'Troy',startTime:'2026-11-14T01:30:00Z',endTime:'2026-11-14T06:00:00Z'};
describe('event API input boundaries',()=>{
  it.each(['junk','2026-15-99','2026-11-13T20:30:00'])('rejects invalid/ambiguous instant %s',startTime=>expect(createEventSchema.safeParse({...valid,startTime}).success).toBe(false));
  it('rejects end before start',()=>expect(createEventSchema.safeParse({...valid,endTime:'2026-11-13T06:00:00Z'}).success).toBe(false));
  it.each([0,-1,0.5,1001])('rejects count %s',count=>expect(recurrenceSchema.safeParse({frequency:'DAILY',interval:1,count}).success).toBe(false));
  it.each([0,-1,0.5,366])('rejects interval %s',interval=>expect(recurrenceSchema.safeParse({frequency:'WEEKLY',interval}).success).toBe(false));
  it('requires monthly weekday parameters',()=>expect(recurrenceSchema.safeParse({frequency:'MONTHLY',interval:1,monthlyPattern:'BY_WEEKDAY'}).success).toBe(false));
  it('rejects unsafe URLs and out-of-range weekdays',()=>{
    expect(createEventSchema.safeParse({...valid,ticketUrl:'javascript:alert(1)'}).success).toBe(false);
    expect(recurrenceSchema.safeParse({frequency:'WEEKLY',daysOfWeek:[9]}).success).toBe(false);
  });
  it('requires a rule for recurring creation and accepts disabling recurrence in a patch',()=>{
    expect(createEventSchema.safeParse({...valid,isRecurring:true}).success).toBe(false);
    expect(updateEventSchema.parse({isRecurring:false})).toEqual({isRecurring:false});
  });
});
