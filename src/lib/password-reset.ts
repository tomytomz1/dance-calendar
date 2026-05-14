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
