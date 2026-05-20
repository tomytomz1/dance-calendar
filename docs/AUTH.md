# Authentication (Auth.js v5 / NextAuth)

## Required environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma / user storage |
| `NEXTAUTH_SECRET` or `AUTH_SECRET` | JWT signing (production must be set) |
| `NEXTAUTH_URL` | Canonical app URL (e.g. `https://michigandance.life`) |

## Production (Vercel)

- Set `NEXTAUTH_URL=https://michigandance.life` (no trailing slash).
- Set `NEXTAUTH_SECRET` to a long random string (`openssl rand -base64 32`).
- Enable `trustHost: true` in [`src/lib/auth.ts`](../src/lib/auth.ts) (already configured).

## HTTPS cookies

Middleware reads `__Secure-authjs.session-token` on HTTPS. See [`src/middleware.ts`](../src/middleware.ts).

## Google OAuth (optional)

`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — redirect URI must match your deployment URL.
