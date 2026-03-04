import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Resets the Prisma client (disconnect + clear global). Use after P1001 connection
 * errors so the next request gets a fresh client. Prisma does not auto-recover from P1001.
 */
export async function resetPrismaClient(): Promise<void> {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
}

/** Lazy proxy so prisma always resolves to current client after reset. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string, unknown>)[prop as string];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
