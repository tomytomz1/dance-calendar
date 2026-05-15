/** Returns the URL only if it uses http or https (defense for legacy bad rows). */
export function safeHttpOrHttpsUrl(
  url: string | null | undefined
): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  return /^https?:\/\//i.test(t) ? t : null;
}
