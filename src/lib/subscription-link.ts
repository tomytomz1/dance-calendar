import { prisma } from "@/lib/prisma";

export type LinkSubscriptionInput = {
  userId: string;
  email: string;
  name?: string | null;
};

/**
 * Attach a guest email subscription to a user account (same canonical email).
 * Merges duplicate rows if both a guest (email-only) and user-linked row exist.
 */
export async function linkSubscriptionToUser({
  userId,
  email,
  name,
}: LinkSubscriptionInput): Promise<void> {
  const canonicalEmail = email.toLowerCase().trim();
  const trimmedName = name?.trim() || undefined;

  const byEmail = await prisma.subscription.findUnique({
    where: { email: canonicalEmail },
  });

  const byUserId = await prisma.subscription.findFirst({
    where: { userId },
  });

  if (byEmail && byUserId && byEmail.id !== byUserId.id) {
    await prisma.subscription.update({
      where: { id: byEmail.id },
      data: {
        userId,
        email: canonicalEmail,
        name: trimmedName ?? byEmail.name ?? byUserId.name,
        danceStyles: [
          ...new Set([...byEmail.danceStyles, ...byUserId.danceStyles]),
        ],
        cities: [...new Set([...byEmail.cities, ...byUserId.cities])],
        emailNotifications:
          byEmail.emailNotifications || byUserId.emailNotifications,
        weeklyDigest: byEmail.weeklyDigest || byUserId.weeklyDigest,
      },
    });
    await prisma.subscription.delete({ where: { id: byUserId.id } });
    return;
  }

  const target = byEmail ?? byUserId;
  if (!target) return;

  await prisma.subscription.update({
    where: { id: target.id },
    data: {
      userId,
      email: canonicalEmail,
      ...(trimmedName ? { name: trimmedName } : {}),
    },
  });
}

/** Prevent sending twice to the same address in one cron run. */
export function dedupeSubscribersByEmail<T extends { email: string }>(
  subscribers: T[]
): T[] {
  const seen = new Set<string>();
  return subscribers.filter((sub) => {
    const key = sub.email.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
