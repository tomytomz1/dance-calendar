/**
 * Canonical public site URL for links in emails and redirects.
 * Trailing slashes are removed.
 */
export function getPublicAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "";
  if (!raw) {
    throw new Error(
      "Missing NEXT_PUBLIC_APP_URL or NEXTAUTH_URL for absolute links"
    );
  }
  return raw.replace(/\/+$/, "");
}
