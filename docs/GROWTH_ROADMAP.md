# MichiganDance.Life — Living Growth Roadmap

**Last updated:** 2026-05-20  
**Plan reference:** `.cursor/plans/growth_roadmap_tracker_429a3ea8.plan.md` (do not edit the plan file from this doc)

## How to use

- Check boxes: `- [ ]` → `- [x]` when done
- Add a line under **Done log** with date + short note
- Status: `Not started` | `In progress` | `Blocked` | `Done`

---

## Done log

| Date | IDs | Note |
|------|-----|------|
| 2026-05-20 | P1-04–P1-16, P2-01–P2-10, P3-01–P3-06, P3-12, D-02 | Code implementation batch (see commit) |
| 2026-05-20 | P1-01–P1-03 | Verified: apex Production, www→apex redirect, `NEXT_PUBLIC_SITE_URL` in Vercel, GSC `/sitemap.xml` Success (60 pages) |

---

## Phase 1 — Quick wins

### Infrastructure and SEO hygiene

- [x] **P1-01** Vercel: redirect `www` → `https://michigandance.life` ([`vercel.json`](../vercel.json) redirects added — confirm in Vercel dashboard)
- [x] **P1-02** `NEXT_PUBLIC_SITE_URL=https://michigandance.life` in Vercel ([`.env.example`](../.env.example))
- [x] **P1-03** Search Console: sitemap Success (manual)

### Brand consistency

- [x] **P1-04** Email templates → MichiganDance.Life ([`src/lib/email.ts`](../src/lib/email.ts))
- [x] **P1-05** `EMAIL_FROM` example updated ([`.env.example`](../.env.example))
- [x] **P1-06** Auth pages use brand logo ([`src/components/layout/auth-brand.tsx`](../src/components/layout/auth-brand.tsx))
- [x] **P1-07** Remaining "Dance Calendar" strings audited

### Public UX and discovery

- [x] **P1-08** Header **Events** link ([`src/components/layout/header.tsx`](../src/components/layout/header.tsx))
- [x] **P1-09** Home CTAs: Browse events + List your event ([`src/components/home/home-hero-ctas.tsx`](../src/components/home/home-hero-ctas.tsx))
- [x] **P1-10** Home Calendar/List tabs ([`src/components/home/home-view-tabs.tsx`](../src/components/home/home-view-tabs.tsx))
- [x] **P1-11** Homepage email subscribe ([`src/components/home/email-subscribe.tsx`](../src/components/home/email-subscribe.tsx), [`src/app/api/subscriptions/public/route.ts`](../src/app/api/subscriptions/public/route.ts))

### Event detail conversions

- [x] **P1-12** Share on event page ([`src/components/events/event-share-button.tsx`](../src/components/events/event-share-button.tsx))
- [x] **P1-13** Open in Google Maps ([`src/lib/maps-url.ts`](../src/lib/maps-url.ts))

### Compliance and measurement

- [x] **P1-14** `/unsubscribe` page ([`src/app/unsubscribe/page.tsx`](../src/app/unsubscribe/page.tsx))
- [x] **P1-15** Email unsubscribe links ([`src/lib/email.ts`](../src/lib/email.ts))
- [x] **P1-16** Analytics component ([`src/components/analytics.tsx`](../src/components/analytics.tsx))

---

## Phase 2 — Growth

### Product

- [x] **P2-01** Profile subscription UI ([`src/components/profile/subscription-preferences.tsx`](../src/components/profile/subscription-preferences.tsx))
- [x] **P2-02** Cron respects subscription prefs (verified in [`src/app/api/cron/notifications/route.ts`](../src/app/api/cron/notifications/route.ts))

### Trust and legal

- [x] **P2-03** SiteFooter ([`src/components/layout/site-footer.tsx`](../src/components/layout/site-footer.tsx))
- [x] **P2-04** `/privacy` ([`src/app/privacy/page.tsx`](../src/app/privacy/page.tsx))
- [x] **P2-05** `/terms` ([`src/app/terms/page.tsx`](../src/app/terms/page.tsx))
- [x] **P2-06** `/contact` ([`src/app/contact/page.tsx`](../src/app/contact/page.tsx))

### Content and SEO

- [x] **P2-07** `/about` ([`src/app/about/page.tsx`](../src/app/about/page.tsx))
- [x] **P2-08** City hub intros ([`src/lib/city-copy.ts`](../src/lib/city-copy.ts))
- [x] **P2-09** Social proof counts ([`src/components/seo/event-count-banner.tsx`](../src/components/seo/event-count-banner.tsx))
- [x] **P2-10** Static pages in sitemap ([`src/app/sitemap.ts`](../src/app/sitemap.ts))

### Marketing ops (manual)

- [ ] **P2-11** Google Business Profile
- [ ] **P2-12** Studio/organizer outreach (5–10 partners)
- [ ] **P2-13** Social playbook + UTM on shares

---

## Phase 3 — Moat

### Engineering

- [x] **P3-01** Unit tests Vitest ([`src/lib/__tests__/`](../src/lib/__tests__/))
- [ ] **P3-02** API smoke tests (deferred — add when CI ready)
- [x] **P3-03** Monitoring docs ([`docs/MONITORING.md`](../docs/MONITORING.md))
- [x] **P3-04** Auth env docs ([`docs/AUTH.md`](../docs/AUTH.md))

### SEO and data

- [x] **P3-05** Next occurrence in SEO lists ([`src/lib/seo.ts`](../src/lib/seo.ts))
- [x] **P3-06** Image remote patterns ([`next.config.ts`](../next.config.ts))

### Scale and polish

- [ ] **P3-07** Upstash Redis rate limits (when multi-region)
- [x] **P3-08** Admin tab extraction started ([`src/app/(dashboard)/admin/admin-stats.tsx`](../src/app/(dashboard)/admin/admin-stats.tsx))
- [ ] **P3-09** Dark mode OR remove next-themes (deferred)
- [ ] **P3-10** Public organizer directory (optional)
- [ ] **P3-11** Blog `/blog` (optional)

### PWA

- [x] **P3-12** Service worker cache bump ([`public/sw.js`](../public/sw.js))

---

## Design backlog

- [ ] **D-01** Display font for headings
- [x] **D-02** Calendar/list toggle (home)
- [ ] **D-03** A11y pass (admin tabs, filters)
- [ ] **D-04** Event form geocoding

---

## Success metrics

| Metric | Baseline | Target | Updated |
|--------|----------|--------|---------|
| Indexed pages | TBD | All events + hubs | |
| Organic clicks | TBD | MoM growth | |
| Organizer sign-ups | TBD | +X/month | |
| Email subscribers | TBD | +X/month | |
| Ticket link clicks | TBD | Track in analytics | |
