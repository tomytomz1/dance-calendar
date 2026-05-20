/**
 * Shared helpers for Prisma connection failures (Neon sleep, network, pool timeout).
 */
export function isDbConnectionError(err: unknown): boolean {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: string }).code;
    if (code === "P1001" || code === "P1017") return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("connection pool") ||
    msg.includes("Timed out fetching a new connection")
  );
}

/** Log without triggering Next.js dev console error overlay for expected DB outages. */
export function logDbUnavailable(context: string, err?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    const hint = isDbConnectionError(err)
      ? " (wake Neon at console.neon.tech or check DATABASE_URL)"
      : "";
    console.warn(`[${context}] Database unavailable${hint}`);
    return;
  }
  console.error(`[${context}]`, err);
}
