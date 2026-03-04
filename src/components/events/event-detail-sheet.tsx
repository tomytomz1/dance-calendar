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

  const eventPath = `/event/${event.id}${event.isRecurring ? `?instance=${encodeURIComponent(event.start.toISOString())}` : ""}`;
  const eventUrl = `${window.location.origin}${eventPath}`;

  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `Check out this dance event: ${event.title} at ${event.venue}`,
      url: eventUrl,
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
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pr-12">
          <SheetTitle className="text-xl font-bold">
            {event.title}
          </SheetTitle>
          {event.isRecurring && (
            <Badge variant="secondary" className="mt-2 w-fit">
              <Repeat className="w-3 h-3 mr-1" />
              Recurring
            </Badge>
          )}
        </SheetHeader>

        <div className="mt-6 flex flex-col">
          <div className="overflow-y-auto space-y-6 text-center">
            <div className="flex flex-wrap gap-2 justify-center">
              {event.danceStyles.map((style) => (
                <Badge key={style} variant="default">
                  {style}
                </Badge>
              ))}
            </div>

            <Separator />

            <div className="space-y-4 flex flex-col items-center">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <p className="font-medium">
                  {format(new Date(event.start), "EEEE, MMMM d, yyyy")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0" />
                <p className="font-medium">
                  {format(new Date(event.start), "h:mm a")} -{" "}
                  {format(new Date(event.end), "h:mm a")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium">{event.venue}</p>
                  <p className="text-sm text-muted-foreground">{event.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium">Organized by</p>
                  <p className="text-sm text-muted-foreground">
                    {event.organizerName}
                  </p>
                </div>
              </div>
            </div>

            <Separator />
          </div>

          <div className="flex-shrink-0 py-6 flex gap-3 justify-center max-w-sm mx-auto">
            <Button
              variant="outline"
              className="flex-1 shrink basis-0 h-12 min-w-0 px-4 has-[>svg]:px-4"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button className="flex-1 shrink basis-0 h-12 min-w-0 px-4" asChild>
              <a
                href={eventPath}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Details
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
