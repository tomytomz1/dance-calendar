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
export function danceImageForStyles(styles: string[]): string {
  for (const style of styles) {
    const result = styleImages[style.toLowerCase()];
    if (result) return result;
  }
  return "/dance/event-beginner-class.webp";
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
export function organizerImageUrl(raw: string | null | undefined): string | null {
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
  return looksLikeImage ? url.toString() : null;
}
