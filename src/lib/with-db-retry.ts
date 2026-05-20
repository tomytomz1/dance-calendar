import { resetPrismaClient } from "@/lib/prisma";
import { isDbConnectionError, logDbUnavailable } from "@/lib/db-errors";
import { isDatabaseReachable } from "@/lib/db-probe";

const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 800;

async function runWithRetries<T>(
  context: string,
  fn: () => Promise<T>,
  options?: { retries?: number }
): Promise<{ ok: true; data: T } | { ok: false }> {
  if (!(await isDatabaseReachable())) {
    logDbUnavailable(context);
    return { ok: false };
  }

  const maxAttempts = options?.retries ?? DEFAULT_RETRIES;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return { ok: true, data: await fn() };
    } catch (error) {
      if (isDbConnectionError(error) && attempt < maxAttempts) {
        await resetPrismaClient();
        const { resetDatabaseProbeCache } = await import("@/lib/db-probe");
        resetDatabaseProbeCache();
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      logDbUnavailable(context, error);
      return { ok: false };
    }
  }

  logDbUnavailable(context);
  return { ok: false };
}

/** Returns fallback when the database is unreachable (after retries). */
export async function withDbRetry<T>(
  context: string,
  fn: () => Promise<T>,
  fallback: T,
  options?: { retries?: number }
): Promise<T> {
  const result = await runWithRetries(context, fn, options);
  return result.ok ? result.data : fallback;
}

/** Returns `{ ok: false }` on failure so callers can show an error vs empty data. */
export async function tryDb<T>(
  context: string,
  fn: () => Promise<T>,
  options?: { retries?: number }
): Promise<{ ok: true; data: T } | { ok: false }> {
  return runWithRetries(context, fn, options);
}
