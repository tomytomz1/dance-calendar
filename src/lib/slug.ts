import { prisma } from "./prisma";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function generateUniqueEventSlug(
  title: string
): Promise<string | null> {
  const base = slugify(title);

  if (!base) {
    return null;
  }

  // Find existing slugs that start with the same base, e.g.
  // "my-event", "my-event-2", "my-event-3".
  const existing = await prisma.event.findMany({
    where: {
      slug: {
        startsWith: base,
      },
    },
    select: { slug: true },
  });

  const used = new Set(
    existing
      .map((e) => e.slug)
      .filter((s): s is string => typeof s === "string" && s.length > 0)
  );

  if (!used.has(base)) {
    return base;
  }

  let counter = 2;
  let candidate = `${base}-${counter}`;

  while (used.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

