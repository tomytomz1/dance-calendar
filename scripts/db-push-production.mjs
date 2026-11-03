/**
 * Syncs the production database schema with prisma/schema.prisma before
 * `next build`. Runs only for Vercel production builds (VERCEL_ENV=production):
 * preview and development deployments share the same database variables, so
 * letting them push would apply unmerged branch schemas to the live database.
 *
 * Changes that would lose data (dropping a column or table, narrowing a type)
 * make `prisma db push` exit non-zero, which fails the build and keeps the
 * current deployment live. Apply those by hand after checking the data.
 */
import { execSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log(
    `[db-push] Skipping schema sync (VERCEL_ENV=${process.env.VERCEL_ENV || "unset"}).`
  );
  process.exit(0);
}

console.log("[db-push] Production build: syncing database schema...");
try {
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
} catch {
  console.error(
    "[db-push] Schema sync failed. If Prisma warned about data loss, apply that change manually; the build is stopped so the live site keeps running the previous deployment."
  );
  process.exit(1);
}
