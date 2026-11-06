/**
 * Organizers type the city freely, so the same place arrives as "Troy",
 * "Troy ", "Troy, MI 48083" or "Ferndale, MI". Normalize for display, filters
 * and city URLs. Stored records are left untouched.
 */
const STATE_AND_ZIP_SUFFIX =
  /(?:,\s*|\s+)(?:mi|mich\.?|michigan)\.?(?:\s+\d{5}(?:-\d{4})?)?\s*$/i;
const ZIP_SUFFIX = /,?\s+\d{5}(?:-\d{4})?\s*$/;

export function normalizeCityName(raw: string | null | undefined): string {
  if (!raw) return "";
  const collapsed = raw.replace(/\s+/g, " ").trim();
  const withoutSuffix = collapsed
    .replace(ZIP_SUFFIX, "")
    .replace(STATE_AND_ZIP_SUFFIX, "")
    .replace(/[,\s]+$/, "")
    .trim();
  return withoutSuffix || collapsed;
}

/** Trim stray whitespace and trailing punctuation, e.g. "Polish American Cultural Center: ". */
export function normalizeVenueName(raw: string | null | undefined): string {
  if (!raw) return "";
  const collapsed = raw.replace(/\s+/g, " ").trim();
  return collapsed.replace(/[\s:;,\-–—]+$/, "").trim() || collapsed;
}
