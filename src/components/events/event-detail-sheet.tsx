"use client";

import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ExternalLink,
  Share2,
  Repeat,
} from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import { toast } from "sonner";

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailSheet({
  event,
  isOpen,
  onClose,
}: EventDetailSheetProps) {
  if (!event) return null;

  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `Check out this dance event: ${event.title} at ${event.venue}`,
      url: `${window.location.origin}/event/${event.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard(shareData.url);
        }
      }
    } else {
      copyToClipboard(shareData.url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left">
          <div className="flex items-start justify-between gap-4">
            <SheetTitle className="text-xl font-bold pr-8">
              {event.title}
            </SheetTitle>
            {event.isRecurring && (
              <Badge variant="secondary" className="shrink-0">
                <Repeat className="w-3 h-3 mr-1" />
                Recurring
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto pb-6">
          <div className="flex flex-wrap gap-2">
            {event.danceStyles.map((style) => (
              <Badge key={style} variant="default">
                {style}
              </Badge>
            ))}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">
                  {format(new Date(event.start), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">
                  {format(new Date(event.start), "h:mm a")} -{" "}
                  {format(new Date(event.end), "h:mm a")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">{event.venue}</p>
                <p className="text-sm text-muted-foreground">{event.city}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Organized by</p>
                <p className="text-sm text-muted-foreground">
                  {event.organizerName}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button className="flex-1 h-12" asChild>
              <a
                href={`/event/${event.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
