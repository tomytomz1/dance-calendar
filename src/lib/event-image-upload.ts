/** Shared rules for organizer event-photo uploads (client and server). */
export const EVENT_IMAGE_UPLOAD = {
  /** Route that issues short-lived client upload tokens. */
  handleUploadUrl: "/api/uploads/event-image",
  /** Every upload lives under this folder in the Blob store. */
  folder: "event-images",
  allowedContentTypes: ["image/jpeg", "image/png", "image/webp"] as string[],
  /** Upper bound after client-side resizing (originals are usually much larger). */
  maximumSizeInBytes: 8 * 1024 * 1024,
  /** Longest edge after client-side resizing. */
  maxDimension: 1600,
  tokenTtlMs: 10 * 60 * 1000,
} as const;

/** Upload pathnames must be event-images/<safe-name>.<jpg|jpeg|png|webp>. */
export function isAllowedEventImagePath(pathname: string): boolean {
  return /^event-images\/[a-z0-9][a-z0-9._-]{0,80}\.(?:jpe?g|png|webp)$/i.test(pathname);
}

/** A safe upload pathname derived from the user's file name. */
export function eventImagePathFor(fileName: string, contentType: string): string {
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const base =
    fileName
      .replace(/\.[^.]*$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "event-photo";
  return `${EVENT_IMAGE_UPLOAD.folder}/${base}.${ext}`;
}
