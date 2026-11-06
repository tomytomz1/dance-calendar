import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const mocks=vi.hoisted(()=>({post:vi.fn(),limit:vi.fn(),find:vi.fn(),create:vi.fn(),hash:vi.fn(),link:vi.fn()}));
vi.mock('@/lib/auth',()=>({handlers:{GET:vi.fn(),POST:mocks.post},hashPassword:mocks.hash}));
vi.mock('@/lib/api-rate-limit',()=>({rateLimitOr429:mocks.limit}));
vi.mock('@/lib/rate-limit',()=>({checkRateLimit:()=>({allowed:true}),getClientIp:()=> 'synthetic-test'}));
vi.mock('@/lib/prisma',()=>({prisma:{user:{findFirst:mocks.find,create:mocks.create}}}));
vi.mock('@/lib/subscription-link',()=>({linkSubscriptionToUser:mocks.link}));
import { POST as authPost } from '@/app/api/auth/[...nextauth]/route';
import { POST as register } from '@/app/api/auth/register/route';
beforeEach(()=>{vi.clearAllMocks();mocks.post.mockResolvedValue(new Response('ok'));mocks.limit.mockReturnValue(null);mocks.create.mockResolvedValue({id:'synthetic-id',email:'qa@example.invalid',name:'QA'});});
it('rejects throttled credentials before the Auth.js handler',async()=>{
 mocks.limit.mockReturnValue(NextResponse.json({error:'Too many requests'},{status:429}));
 expect((await authPost(new NextRequest('https://isolated.invalid/api/auth/callback/credentials',{method:'POST'}))).status).toBe(429);
 expect(mocks.post).not.toHaveBeenCalled();
});
it('preserves OAuth handler behavior',async()=>{
 expect((await authPost(new NextRequest('https://isolated.invalid/api/auth/signin/google',{method:'POST'}))).status).toBe(200);
 expect(mocks.limit).not.toHaveBeenCalled();
});
it('returns the same response for existing and newly registered accounts',async()=>{
 const req=()=>new Request('https://isolated.invalid/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'QA',email:'qa@example.invalid',password:'synthetic-only-password'})});
 mocks.find.mockResolvedValue({id:'existing'});const existing=await register(req());
 mocks.find.mockResolvedValue(null);const created=await register(req());
 expect(created.status).toBe(existing.status);expect(await created.json()).toEqual(await existing.json());
});
