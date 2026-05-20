import { prisma, resetPrismaClient } from "@/lib/prisma";
import { isDbConnectionError, logDbUnavailable } from "@/lib/db-errors";

type ProbeState = { ok: boolean; checkedAt: number };

let probeState: ProbeState | null = null;
const PROBE_TTL_MS = 30_000;

/**
 * Cached DB reachability check for dev. Avoids repeated heavy findMany calls
 * when Neon is asleep or unreachable.
 */
export async function isDatabaseReachable(): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") {
    return true;
  }

  const now = Date.now();
  if (probeState && now - probeState.checkedAt < PROBE_TTL_MS) {
    return probeState.ok;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    probeState = { ok: true, checkedAt: now };
    return true;
  } catch (error) {
    if (isDbConnectionError(error)) {
      await resetPrismaClient();
    }
    probeState = { ok: false, checkedAt: now };
    logDbUnavailable("database probe");
    return false;
  }
}

export function resetDatabaseProbeCache(): void {
  probeState = null;
}
