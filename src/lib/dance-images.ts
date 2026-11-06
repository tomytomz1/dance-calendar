/**
 * AI-generated illustrative imagery for dance-style discovery.
 * Never imply these photographs depict a specific event or venue.
 */
const styleImages: Record<string, string> = {
  salsa: "/dance/event-salsa.webp",
  bachata: "/dance/event-bachata.webp",
  kizomba: "/dance/event-kizomba.webp",
  swing: "/dance/event-swing.webp",
  "lindy hop": "/dance/event-swing.webp",
  "west coast swing": "/dance/event-swing.webp",
  ballroom: "/dance/event-ballroom.webp",
  waltz: "/dance/event-ballroom.webp",
};
const DEFAULT_IMAGE = "/dance/event-beginner-class.webp";

/**
 * Illustrative art for an event's styles. Pass `avoid` (images already used
 * nearby, e.g. in the same card row) to prefer a different matching style.
 */
export function danceImageForStyles(styles: string[], avoid?: ReadonlySet<string>): string {
  const matches = styles
    .map((style) => styleImages[style.toLowerCase()])
    .filter((image): image is string => Boolean(image));
  if (avoid) {
    const fresh = matches.find((image) => !avoid.has(image));
    if (fresh) return fresh;
    if (!avoid.has(DEFAULT_IMAGE)) return DEFAULT_IMAGE;
  }
  return matches[0] ?? DEFAULT_IMAGE;
}

const IMAGE_EXTENSION = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const IMAGE_HOSTS = [
  /(^|\.)fbcdn\.net$/i,
  /(^|\.)cdninstagram\.com$/i,
  /(^|\.)googleusercontent\.com$/i,
  /(^|\.)amazonaws\.com$/i,
  /(^|\.)unsplash\.com$/i,
  /(^|\.)cloudinary\.com$/i,
  /(^|\.)imgix\.net$/i,
  /(^|\.)evbuc\.com$/i,
  /(^|\.)public\.blob\.vercel-storage\.com$/i,
];

/**
 * Organizers often paste a Facebook page or share link into "image URL".
 * Only treat the value as a photo when it plausibly points at an image file;
 * otherwise callers fall back to the illustrative category art.
 */
export function organizerImageUrl(
  raw: string | null | undefined,
  now: number = Date.now()
): string | null {
  if (!raw?.trim()) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const looksLikeImage =
    IMAGE_EXTENSION.test(url.pathname) ||
    IMAGE_HOSTS.some((host) => host.test(url.hostname));
  if (!looksLikeImage) return null;
  if (isExpiredSignedFacebookUrl(url, now)) return null;
  return url.toString();
}

/** Facebook CDN links are signed; `oe` is the hex Unix expiry, after which they return 403. */
function isExpiredSignedFacebookUrl(url: URL, now: number): boolean {
  if (!/(^|\.)(fbcdn\.net|cdninstagram\.com)$/i.test(url.hostname)) return false;
  const oe = url.searchParams.get("oe");
  if (!oe || !/^[0-9a-f]{6,10}$/i.test(oe)) return false;
  return parseInt(oe, 16) * 1000 < now;
}
