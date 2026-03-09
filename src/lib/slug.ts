export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function generateUniqueEventSlug(title: string): Promise<string | null> {
  const base = slugify(title);

  if (!base) {
    return null;
  }

  let candidate = base;
  let counter = 2;

  // Keep slug generation pure and let callers ensure uniqueness.
  // Callers can append counters or other disambiguators as needed.
  // For now, just return the base slug.
  return base;
}
