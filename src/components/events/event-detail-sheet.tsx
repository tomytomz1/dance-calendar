"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, Share2, Repeat, ArrowRight } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import { toast } from "sonner";

interface EventDetailSheetProps {
  /** Event whose start/end are Michigan wall-clock dates (see toSiteWallClock). */
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

function eventHref(event: CalendarEvent): string {
  const path = `/event/${event.slug ?? event.id}`;
  return event.occurrenceStart
    ? `${path}?instance=${encodeURIComponent(event.occurrenceStart)}`
    : path;
}

export function EventDetailSheet({ event, isOpen, onClose, returnFocusRef }: EventDetailSheetProps) {
  if (!event) return null;

  const eventPath = eventHref(event);
  const eventUrl = `${window.location.origin}${eventPath}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy the link");
    }
  };

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
          void copyToClipboard(shareData.url);
        }
      }
    } else {
      void copyToClipboard(shareData.url);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        onCloseAutoFocus={(closeEvent) => {
          const trigger = returnFocusRef?.current;
          if (trigger?.isConnected && trigger !== document.body) {
            closeEvent.preventDefault();
            trigger.focus();
          }
        }}
        side="bottom"
        className="mx-auto max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border-[#755572] bg-[#1D1726] text-[#FFF1E5]"
      >
        <SheetHeader className="pr-12 text-left">
          <SheetTitle className="font-display text-2xl font-extrabold text-[#FFF1E5]">
            {event.title}
          </SheetTitle>
          <SheetDescription className="text-[#D2C0D0]">
            {format(event.start, "EEEE, MMMM d")} · {event.venue}
          </SheetDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            {event.isRecurring && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#B58EB0] px-2.5 py-1 text-xs font-semibold text-[#F3D9EE]">
                <Repeat className="h-3 w-3" aria-hidden="true" /> Recurring
              </span>
            )}
            {event.danceStyles.map((style, i) => (
              <span
                key={style}
                className={
                  i === 0
                    ? "rounded-full bg-[#F46157] px-2.5 py-1 text-xs font-semibold text-[#160E18]"
                    : "rounded-full bg-[#704582] px-2.5 py-1 text-xs font-semibold text-white"
                }
              >
                {style}
              </span>
            ))}
          </div>
        </SheetHeader>

        <dl className="mx-4 space-y-4 rounded-2xl border border-[#694E65] bg-[#171320] p-4">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#FF8179]" aria-hidden="true" />
            <div>
              <dt className="sr-only">Date</dt>
              <dd className="font-semibold">{format(event.start, "EEEE, MMMM d, yyyy")}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#FF8179]" aria-hidden="true" />
            <div>
              <dt className="sr-only">Time</dt>
              <dd className="font-semibold">
                {format(event.start, "h:mm a")} – {format(event.end, "h:mm a")}
                <span className="ml-1 text-xs font-normal text-[#BFAEBD]">Michigan time</span>
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#FF8179]" aria-hidden="true" />
            <div>
              <dt className="sr-only">Venue</dt>
              <dd>
                <p className="font-semibold">{event.venue}</p>
                <p className="text-sm text-[#D2C0D0]">{event.city}</p>
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-5 w-5 shrink-0 text-[#FF8179]" aria-hidden="true" />
            <div>
              <dt className="text-sm text-[#D2C0D0]">Organized by</dt>
              <dd className="font-semibold">{event.organizerName}</dd>
            </div>
          </div>
        </dl>

        <div className="mx-auto flex w-full max-w-sm gap-3 px-4 py-6">
          <Button
            variant="outline"
            className="h-12 min-w-0 flex-1 basis-0 rounded-full border-[#875D7D] px-4"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Share
          </Button>
          <Button className="h-12 min-w-0 flex-1 basis-0 rounded-full px-4 font-bold" asChild>
            <Link href={eventPath}>
              View details <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
