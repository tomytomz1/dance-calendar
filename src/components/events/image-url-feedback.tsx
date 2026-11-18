"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { organizerImageUrl } from "@/lib/dance-images";

/**
 * Tells organizers right away whether the pasted "image URL" can be shown.
 * Share links (iCloud, Google Photos, Facebook, Instagram) open a web page,
 * not the picture itself, so the site falls back to illustrative art.
 */
export function ImageUrlFeedback({ value }: { value: string | undefined }) {
  const trimmed = value?.trim() ?? "";
  const usable = trimmed ? organizerImageUrl(trimmed) : null;
  const [failed, setFailed] = useState<string | null>(null);

  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;

  if (!usable) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
        <span>
          This is a link to a page, not to the photo itself, so it can&apos;t be shown on the
          site. Share links from iCloud, Google Photos, Facebook or Instagram don&apos;t work.
          Use a link that opens only the image (usually ending in .jpg, .png or .webp). Until
          then, your event shows an illustrative dance photo.
        </span>
      </p>
    );
  }

  if (failed === usable) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
        <span>
          This image couldn&apos;t be loaded. The link may be private or expired. Your event will
          show an illustrative dance photo instead.
        </span>
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-[#D2C0D0]" role="status">
      {/* eslint-disable-next-line @next/next/no-img-element -- preview of an arbitrary organizer URL */}
      <img
        src={usable}
        alt="Preview of the event image"
        className="h-16 w-24 rounded-md border border-[#694E65] object-cover"
        referrerPolicy="no-referrer"
        onError={() => setFailed(usable)}
      />
      <span className="inline-flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" /> Image preview
      </span>
    </div>
  );
}
