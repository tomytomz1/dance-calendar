"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVENT_IMAGE_UPLOAD, eventImagePathFor } from "@/lib/event-image-upload";

interface EventImageUploadProps {
  value: string | undefined;
  onChange: (url: string) => void;
}

/**
 * Resize to the site's display size and re-encode as JPEG. This also converts
 * iPhone HEIC photos (which browsers can decode but the site can't serve) and
 * keeps uploads small on mobile data.
 */
async function prepareImage(file: File): Promise<{ blob: Blob; contentType: string; name: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, EVENT_IMAGE_UPLOAD.maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) throw new Error("encode failed");
    return { blob, contentType: "image/jpeg", name: file.name };
  } catch {
    // The browser couldn't decode it; upload the original if it's a web format.
    if (EVENT_IMAGE_UPLOAD.allowedContentTypes.includes(file.type)) {
      return { blob: file, contentType: file.type, name: file.name };
    }
    throw new Error("This photo format isn't supported. Please choose a JPG, PNG or WebP image.");
  }
}

export function EventImageUpload({ value, onChange }: EventImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isUploaded = Boolean(value && /\.public\.blob\.vercel-storage\.com\//.test(value));

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setProgress(0);
    setStatus("uploading");
    try {
      const prepared = await prepareImage(file);
      if (prepared.blob.size > EVENT_IMAGE_UPLOAD.maximumSizeInBytes) {
        throw new Error("This photo is too large (8 MB max). Please choose a smaller one.");
      }
      const result = await upload(eventImagePathFor(prepared.name, prepared.contentType), prepared.blob, {
        access: "public",
        handleUploadUrl: EVENT_IMAGE_UPLOAD.handleUploadUrl,
        contentType: prepared.contentType,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      onChange(result.url);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error && err.message ? err.message : "Upload failed. Please try again.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-full"
          disabled={status === "uploading"}
          onClick={() => inputRef.current?.click()}
        >
          {status === "uploading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Uploading… {progress}%
            </>
          ) : (
            <>
              <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
              {isUploaded ? "Replace photo" : "Upload photo"}
            </>
          )}
        </Button>
        {isUploaded && status !== "uploading" && (
          <Button type="button" variant="ghost" className="h-12" onClick={() => onChange("")}>
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Remove photo
          </Button>
        )}
      </div>
      <p aria-live="polite" className="text-sm">
        {status === "uploading" && <span className="text-[#D2C0D0]">Uploading your photo…</span>}
        {status === "error" && error && <span className="text-red-300">{error}</span>}
      </p>
    </div>
  );
}
