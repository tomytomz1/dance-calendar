"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface EventCoverImageProps {
  /** Organizer-supplied photo (already validated with organizerImageUrl). */
  src: string | null;
  /** Illustrative category art used when there is no usable organizer photo. */
  fallbackSrc: string;
  alt: string;
  className?: string;
  labelClassName?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  width?: number;
  height?: number;
}

/**
 * Event photo that falls back to illustrative art (labelled as such) when the
 * organizer's image is missing or fails to load — e.g. expired Facebook CDN links.
 */
export function EventCoverImage({
  src,
  fallbackSrc,
  alt,
  className,
  labelClassName,
  loading = "lazy",
  fetchPriority,
  width,
  height,
}: EventCoverImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usesFallback = !src || failedSrc === src;
  const current = usesFallback ? fallbackSrc : src;

  // The image may already have failed before React hydrated and attached onError.
  const imgRef = useCallback(
    (img: HTMLImageElement | null) => {
      if (src && img && img.complete && img.naturalWidth === 0 && img.currentSrc === src) {
        setFailedSrc(src);
      }
    },
    [src]
  );

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote organizer hosts vary; local art is pre-optimized WebP */}
      <img
        ref={imgRef}
        src={current}
        alt={usesFallback ? "" : alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          if (src && !usesFallback) setFailedSrc(src);
        }}
        className={className}
      />
      {usesFallback && (
        <span
          className={cn(
            "pointer-events-none absolute rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white/90",
            labelClassName ?? "bottom-2 right-2"
          )}
        >
          Illustrative photo
        </span>
      )}
    </>
  );
}
