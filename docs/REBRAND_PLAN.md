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
6. [x] Finish responsive browser/keyboard/visual QA against authenticated preview (see "QA findings" below).
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

## QA findings fixed before release (Nov 2026)
- **Time zone (pre-existing, also on production):** Vercel functions run in UTC, so recurring
  rules expanded on the wrong weekday (e.g. a 3rd-Friday 8:15 PM social appeared on Thursday),
  drifted an hour across DST, and server-rendered times showed UTC. The Node runtime is now
  pinned to America/Detroit (`src/instrumentation.ts`, `next.config.ts`) and all display code
  formats in Michigan time (`src/lib/timezone.ts`), so visitors anywhere see venue-local times.
- Open-ended recurring series now expand up to the calendar horizon instead of stopping 12
  months after their first date.
- Recurring occurrences link to `/event/<slug>?instance=<ISO>`; without `instance` the detail
  page shows the next occurrence (canonical URL unchanged).
- Free-text cities are normalized ("Troy, MI 48083" → "Troy"); legacy city URLs 308-redirect.
- Organizer "image URLs" that are Facebook page links or expired signed CDN links fall back to
  labelled illustrative art.
- Calendar: phone grid no longer blocks vertical scrolling; whole day cells are tap targets;
  restyled desktop week view; empty states; "next dance night" jump.
- Hub pages now carry an Open Graph image; per-event share image rebranded.

## Data notes (not changed by this work)
- Some events have city text that is a full address (e.g. "Godfather Bistro Cigar Bar 14073 23
  Mile Rd Shelby Charter Township") and some start times disagree with their descriptions
  (e.g. "Bachata & Cocktails SBK Social" is stored as 12:00 PM). Organizers can correct these.
- `EventInstance` rows produced by the weekly cron were generated in UTC and contain duplicates;
  the public calendar does not read them (it expands rules on the fly).

## Automated QA (scratch scripts, run against the protected preview)
- Calendar E2E: month/week navigation, today, selection, agenda, sheet, occurrence links,
  city/style/combined filters, clear, mobile tap/swipe/vertical scroll, in four visitor time zones.
- axe-core WCAG 2.1 AA scan of key pages at 1280px and 390px; Lighthouse mobile.
