# Monitoring and analytics

## Analytics (implemented)

Set **one** of:

- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=michigandance.life` — Plausible (privacy-friendly)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX` — Google Analytics 4

Component: [`src/components/analytics.tsx`](../src/components/analytics.tsx)

## Error monitoring (recommended)

For production, add [Sentry](https://sentry.io) for Next.js:

1. `npx @sentry/wizard@latest -i nextjs`
2. Set `SENTRY_DSN` in Vercel
3. Redeploy

## Uptime

Use Vercel analytics or an external ping on `https://michigandance.life` and `/api/events`.

## Logs

Vercel → Project → Logs for API/cron failures (`CRON_SECRET` on cron routes).
