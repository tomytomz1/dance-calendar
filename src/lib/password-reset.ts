import { randomBytes, createHash } from "crypto";
import { prisma } from "./prisma";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_IDENTIFIER_PREFIX = "password-reset:";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function resetIdentifier(email: string): string {
  return `${RESET_IDENTIFIER_PREFIX}${email.toLowerCase().trim()}`;
}

export function createPasswordResetToken(): string {
  return randomBytes(RESET_TOKEN_BYTES).toString("hex");
}

export async function storePasswordResetToken(
  email: string,
  token: string
): Promise<void> {
  const identifier = resetIdentifier(email);
  const hashed = hashToken(token);
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashed,
      expires,
    },
  });
}

export async function verifyPasswordResetToken(
  token: string
): Promise<{ email: string } | null> {
  const hashed = hashToken(token);
  const now = new Date();

  const record = await prisma.verificationToken.findFirst({
    where: {
      token: hashed,
      identifier: { startsWith: RESET_IDENTIFIER_PREFIX },
      expires: { gt: now },
    },
  });

  if (!record) {
    return null;
  }

  const email = record.identifier.slice(RESET_IDENTIFIER_PREFIX.length);
  return { email };
}

export async function consumePasswordResetToken(token: string): Promise<void> {
  const hashed = hashToken(token);
  await prisma.verificationToken.deleteMany({
    where: { token: hashed },
  });
}

/** Claim the token and change credentials atomically: a racing request must lose. */
export async function resetPasswordWithToken(token: string, passwordHash: string): Promise<boolean> {
  const hashed = hashToken(token);
  return prisma.$transaction(async (tx) => {
    const record = await tx.verificationToken.findFirst({
      where: { token: hashed, identifier: { startsWith: RESET_IDENTIFIER_PREFIX }, expires: { gt: new Date() } },
    });
    if (!record) return false;
    const claimed = await tx.verificationToken.deleteMany({
      where: { token: hashed, identifier: record.identifier, expires: { gt: new Date() } },
    });
    if (claimed.count !== 1) return false;
    const email = record.identifier.slice(RESET_IDENTIFIER_PREFIX.length);
    const user = await tx.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, password: { not: null } },
      select: { id: true, password: true },
    });
    if (!user?.password) return false;
    await tx.user.update({ where: { id: user.id }, data: { password: passwordHash } });
    await tx.verificationToken.deleteMany({ where: { identifier: record.identifier } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    return true;
  });
}
