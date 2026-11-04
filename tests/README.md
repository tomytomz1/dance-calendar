# Release audit tests

`npm test` runs the regular Vitest suite without a database.

`npx vitest run --config vitest.integration.config.ts` exercises the real
Prisma persistence and concurrent generation paths. Authentication is mocked
only in these direct-handler tests; the browser audit uses real credentials,
sessions and HTTP endpoints. Integration writes refuse any database except
the dedicated `audit_pr5_release` database on the isolated QA endpoint.

The separate `qa/pr5-isolated-release-2026-11-04` Vercel preview has branch-only
database overrides and disabled email/OAuth providers. Its build invokes
`scripts/run-isolated-audit.mjs`, which verifies isolation before schema setup,
integration tests, a production-mode Next build and browser tests. That runner
must never be configured on production or the redesign preview. Its synthetic
identities end in `@example.invalid`. Results are emitted in build logs and in
the QA preview's `/qa-release-report.json`. Optional Lighthouse results are
enabled only by `MDL_AUDIT_PERFORMANCE=1` on the QA branch.

`npm run build` only builds the application. It no longer applies Prisma schema
changes to the live database. Any production schema change is a separate,
explicitly approved operation with a tested backup/rollback plan. This release
does not change `prisma/schema.prisma`.
