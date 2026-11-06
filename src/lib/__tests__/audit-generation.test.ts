import { beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({transaction:vi.fn(),lock:vi.fn(),find:vi.fn(),existing:vi.fn(),insert:vi.fn(),remove:vi.fn()}));
vi.mock('@/lib/prisma',()=>({prisma:{$transaction:mocks.transaction}}));
import { generateInstancesForEvent } from '@/lib/recurrence';
import { pinProcessTimeZone } from '@/lib/timezone';
beforeEach(()=>{
 pinProcessTimeZone();vi.clearAllMocks();
 const tx={$queryRaw:mocks.lock,event:{findUnique:mocks.find},eventInstance:{findMany:mocks.existing,createMany:mocks.insert,deleteMany:mocks.remove}};
 mocks.transaction.mockImplementation((fn)=>fn(tx));mocks.lock.mockResolvedValue([{id:'test-event'}]);
 mocks.find.mockResolvedValue({id:'test-event',isRecurring:true,startTime:new Date('2026-11-21T02:00Z'),endTime:new Date('2026-11-21T07:00Z'),recurrenceRule:{frequency:'MONTHLY',interval:1,daysOfWeek:[],monthlyPattern:'BY_WEEKDAY',monthlyDayOfWeek:5,monthlyWeeks:[3],until:new Date('2026-12-31T05:00Z'),count:null}});
 mocks.existing.mockResolvedValue([]);mocks.insert.mockImplementation(({data})=>({count:data.length}));
});
it('locks the parent before inspecting records and is sequentially idempotent',async()=>{
 const stored:Date[]=[];mocks.existing.mockImplementation(()=>stored.map(startTime=>({startTime})));mocks.insert.mockImplementation(({data})=>{stored.push(...data.map((i:{startTime:Date})=>i.startTime));return {count:data.length}});
 expect(await generateInstancesForEvent('test-event')).toBe(2);expect(await generateInstancesForEvent('test-event')).toBe(0);
 expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(mocks.find.mock.invocationCallOrder[0]);
 expect(mocks.transaction.mock.calls[0][1]).toEqual({isolationLevel:'ReadCommitted',timeout:15000});
 expect(mocks.remove).not.toHaveBeenCalled();
});
it('preserves stored timestamps without updating existing rows',async()=>{
 mocks.existing.mockResolvedValue([{startTime:new Date('2026-11-21T02:00Z')},{startTime:new Date('2026-11-21T02:00Z')}]);
 expect(await generateInstancesForEvent('test-event')).toBe(1);expect(mocks.remove).not.toHaveBeenCalled();
 expect(mocks.insert.mock.calls[0][0].data).toHaveLength(1);
});
it('restricts replacement to ordinary future instances, retaining exceptions',async()=>{
 await generateInstancesForEvent('test-event',{replaceFuture:true});
 expect(mocks.remove).toHaveBeenCalledWith({where:{eventId:'test-event',startTime:{gt:expect.any(Date)},isModified:false,isCancelled:false}});
 expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0]);
});
it('does not insert for a missing event',async()=>{
 mocks.find.mockResolvedValue(null);expect(await generateInstancesForEvent('missing')).toBe(0);expect(mocks.insert).not.toHaveBeenCalled();
});
