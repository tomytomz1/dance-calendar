# Michigan Dance Life — Rebrand rollout plan

## Direction and invariants
Brand: **Michigan Dance Life** — "Find your rhythm. Find your people."

Editorial nightlife palette: midnight #0D101B, cream #F7EFE5, coral #F46157, orchid #9353A8. Images and vector marks generated for this rebrand via Higgsfield.

The application is **not** being rebuilt: Next.js, Prisma, auth roles, recurring event expansion, event detail pages, event submissions, subscription APIs, sitemap, schema.org event records, and canonical routes remain operational.

## Implementation stages

1. [x] Audit codebase and Vercel source branch.
2. [x] Integrate optimized local AI imagery + vector logos; add responsive hero and brand tokens.
3. [x] Build new homepage and feature real upcoming events without making up listings.
4. [x] Add dedicated /calendar and city/style filters; restyle real month agenda and mobile views.
5. [x] Style listing cards; update logo, OG image, manifest, and event navigation.
6. [ ] Finish responsive browser/keyboard/visual QA against authenticated preview.
7. [ ] Merge to master and deploy production only after approval.

## Required validation
- No fake events, prices, locations, or times.
- City/style filters derived from real approved event records.
- Recurring instances continue to render with unique keys.
- All event detail URLs and schema markup preserve existing contract.
- Live emails, writes, payments, and database schema never changed by preview tests.
- All custom assets self-hosted under /public.
- AI fallback images are visibly labeled **Illustrative photo** and never passed off as event photographs.
- Verify Vercel preview protected by SSO using an authorized session.

## Commands (no database mutations)
Use npm ci; npx tsc --noEmit; npm test; npx eslint <changed files>; VERCEL_ENV=preview npx next build.

**Do not** test build scripts under VERCEL_ENV=production; in production, the existing build script may invoke prisma db push.
