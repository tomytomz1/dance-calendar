/** Parse redirects as the browser does, including control-character normalization. */
export function internalRedirectPath(raw: string | null | undefined): string {
  if (!raw?.startsWith('/') || raw.includes('\\')) return '/';
  try {
    const origin = 'https://internal.invalid';
    const url = new URL(raw, origin);
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : '/';
  } catch { return '/'; }
}
