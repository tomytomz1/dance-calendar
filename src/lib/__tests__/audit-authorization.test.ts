import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({auth:vi.fn(),findUnique:vi.fn(),update:vi.fn(),del:vi.fn(),generate:vi.fn()}));
vi.mock('@/lib/auth',()=>({auth:mocks.auth}));
vi.mock('@/lib/prisma',()=>({prisma:{event:{findUnique:mocks.findUnique,update:mocks.update,delete:mocks.del}}}));
vi.mock('@/lib/recurrence',()=>({generateInstancesForEvent:mocks.generate,getUpcomingInstances:vi.fn()}));
vi.mock('@/lib/slug',()=>({generateUniqueEventSlug:vi.fn()}));
vi.mock('@/lib/api-rate-limit',()=>({rateLimitOr429:()=>null}));
import * as eventRoute from '@/app/api/events/[id]/route';
import * as instanceRoute from '@/app/api/events/[id]/instances/route';
import * as eventsRoute from '@/app/api/events/route';
import * as profileRoute from '@/app/api/profile/route';
import * as adminEvents from '@/app/api/admin/events/route';
import * as adminPending from '@/app/api/admin/events/pending/route';
import * as adminCounts from '@/app/api/admin/pending-counts/route';
import * as adminUsers from '@/app/api/admin/users/route';
import * as adminUser from '@/app/api/admin/users/[id]/route';
import * as adminApprove from '@/app/api/admin/users/[id]/approve/route';
const params={params:Promise.resolve({id:'other-event'})};
const request=(method='GET',body?:object)=>new Request('https://isolated.invalid/api/events/other-event',{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue(null);mocks.findUnique.mockResolvedValue({organizerId:'owner',status:'APPROVED',startTime:new Date('2026-11-14T01:30Z'),endTime:new Date('2026-11-14T06:00Z')});});
describe('mocked server authorization; no network or database writes',()=>{
  const adminReads=[adminEvents.GET,adminPending.GET,adminCounts.GET,adminUsers.GET];
  for(const role of [null,'USER','ORGANIZER']) {
    it.each(adminReads.map((fn,i)=>[i,fn] as const))(`denies ${role} on admin read %s`,async(_,fn)=>{
      mocks.auth.mockResolvedValue(role?{user:{id:'visitor',role}}:null);
      const response=await fn(request()); expect(response.status).toBe(401);
      expect(mocks.findUnique).not.toHaveBeenCalled();
    });
    it(`denies ${role} on admin writes`,async()=>{
      mocks.auth.mockResolvedValue(role?{user:{id:'visitor',role}}:null);
      expect((await adminUser.DELETE(request('DELETE'),params)).status).toBe(401);
      expect((await adminApprove.POST(request('POST'),params)).status).toBe(401);
      expect((await adminApprove.DELETE(request('DELETE'),params)).status).toBe(401);
    });
  }
  it('denies unauthenticated event mutations before data access',async()=>{
    expect((await eventRoute.PATCH(request('PATCH',{}),params)).status).toBe(401);
    expect((await eventRoute.DELETE(request('DELETE'),params)).status).toBe(401);
    expect((await instanceRoute.POST(request('POST'),params)).status).toBe(401);
    expect((await eventsRoute.POST(request('POST',{}))).status).toBe(401);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it('denies another organizer editing/deleting/regenerating an event',async()=>{
    mocks.auth.mockResolvedValue({user:{id:'other',role:'ORGANIZER'}});
    expect((await eventRoute.PATCH(request('PATCH',{}),params)).status).toBe(403);
    expect((await eventRoute.DELETE(request('DELETE'),params)).status).toBe(403);
    expect((await instanceRoute.POST(request('POST'),params)).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();expect(mocks.del).not.toHaveBeenCalled();expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('hides private event records from strangers',async()=>{
    mocks.findUnique.mockResolvedValue({organizerId:'owner',status:'DRAFT'});
    expect((await eventRoute.GET(request(),params)).status).toBe(404);
    expect((await instanceRoute.GET(request(),params)).status).toBe(404);
  });
  it('denies ordinary and unverified users creating events',async()=>{
    for(const user of [{id:'u',role:'USER',verified:true},{id:'o',role:'ORGANIZER',verified:false}]){
      mocks.auth.mockResolvedValue({user});expect((await eventsRoute.POST(request('POST',{}))).status).toBe(403);
    }
  });
  it('protects profile data without a session',async()=>{
    expect((await profileRoute.GET()).status).toBe(401);
    expect((await profileRoute.PATCH(request('PATCH',{}))).status).toBe(401);
  });
  it('validates patched end against the stored start before update',async()=>{
    mocks.auth.mockResolvedValue({user:{id:'owner',role:'ORGANIZER',verified:true}});
    expect((await eventRoute.PATCH(request('PATCH',{endTime:'2026-11-13T06:00:00Z'}),params)).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([{role:'USER',verified:true},{role:'ORGANIZER',verified:false}])('denies revoked event-management capability for an existing owner %j',async flags=>{
    mocks.auth.mockResolvedValue({user:{id:'owner',...flags}});
    mocks.update.mockResolvedValue({id:'other-event',isRecurring:false,recurrenceRule:null});
    expect((await eventRoute.PATCH(request('PATCH',{title:'Should not publish'}),params)).status).toBe(403);
    expect((await eventRoute.DELETE(request('DELETE'),params)).status).toBe(403);
    expect((await instanceRoute.POST(request('POST'),params)).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();expect(mocks.del).not.toHaveBeenCalled();expect(mocks.generate).not.toHaveBeenCalled();
  });
});
