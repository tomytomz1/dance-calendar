"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface EventShareButtonProps {
  title: string;
  venue: string;
  url: string;
  className?: string;
}

export function EventShareButton({
  title,
  venue,
  url,
  className,
}: EventShareButtonProps) {
  const handleShare = async () => {
    const shareData = {
      title,
      text: `Check out this dance event: ${title} at ${venue}`,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={handleShare}
    >
      <Share2 className="w-4 h-4 mr-2" />
      Share
    </Button>
  );
}
