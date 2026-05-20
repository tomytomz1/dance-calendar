# Monitoring and analytics

## Analytics (implemented)

**Vercel Web Analytics** — `<Analytics />` from `@vercel/analytics/next` in [`src/app/layout.tsx`](../src/app/layout.tsx) per [Vercel quickstart](https://vercel.com/docs/analytics/quickstart). Enable in the Vercel project dashboard (Analytics → Web Analytics → Enable). No env var required.

Optional third-party (set **one** if desired):

- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=michigandance.life` — Plausible (privacy-friendly)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX` — Google Analytics 4

## Error monitoring (recommended)

For production, add [Sentry](https://sentry.io) for Next.js:

1. `npx @sentry/wizard@latest -i nextjs`
2. Set `SENTRY_DSN` in Vercel
3. Redeploy

## Uptime

Use Vercel analytics or an external ping on `https://michigandance.life` and `/api/events`.

## Logs

Vercel → Project → Logs for API/cron failures (`CRON_SECRET` on cron routes).
