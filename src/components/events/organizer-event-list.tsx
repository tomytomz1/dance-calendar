"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Edit, Eye, Trash2 } from "lucide-react";
import { EVENT_STATUS_LABELS } from "@/lib/types";
import { DeleteEventDialog } from "./delete-event-dialog";

interface EventData {
  id: string;
  title: string;
  status: string;
  startTime: string;
  venue: string;
  city: string;
  danceStyles: string[];
  isRecurring?: boolean;
  slug?: string;
  recurrenceRule?: {
    frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    monthlyPattern?: "BY_DATE" | "BY_WEEKDAY" | null;
    monthlyDayOfWeek?: number | null;
    monthlyWeeks?: number[];
  } | null;
}

interface OrganizerEventListProps {
  initialEvents: EventData[];
}

function getStatusVariant(status: string) {
  switch (status) {
    case "APPROVED":
      return "default" as const;
    case "PENDING_APPROVAL":
      return "secondary" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function getRecurrenceLabel(event: EventData): string | null {
  if (!event.isRecurring || !event.recurrenceRule) return null;

  const { frequency, monthlyPattern, monthlyDayOfWeek, monthlyWeeks } =
    event.recurrenceRule;

  if (
    frequency === "MONTHLY" &&
    monthlyPattern === "BY_WEEKDAY" &&
    monthlyDayOfWeek != null &&
    monthlyWeeks &&
    monthlyWeeks.length > 0
  ) {
    const weekdayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const weekLabels: Record<number, string> = {
      1: "1st",
      2: "2nd",
      3: "3rd",
      4: "4th",
      [-1]: "last",
    };

    const parts = [...monthlyWeeks]
      .map((w) => weekLabels[w] ?? `${w}th`)
      .sort((a, b) => a.localeCompare(b));

    const weekPart = parts.join(" & ");

    return `Every ${weekPart} ${weekdayNames[monthlyDayOfWeek]} of the month`;
  }

  if (frequency === "MONTHLY") {
    const day = new Date(event.startTime).getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";
    return `Every month on the ${day}${suffix}`;
  }

  return null;
}

export function OrganizerEventList({ initialEvents }: OrganizerEventListProps) {
  const [events, setEvents] = useState(initialEvents);
  const [deleteTarget, setDeleteTarget] = useState<EventData | null>(null);

  const handleDeleted = () => {
    if (deleteTarget) {
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <Badge variant={getStatusVariant(event.status)}>
                  {EVENT_STATUS_LABELS[event.status as keyof typeof EVENT_STATUS_LABELS]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(event.startTime), "PPP 'at' p")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue}, {event.city}</span>
                </div>
                {getRecurrenceLabel(event) && (
                  <p className="text-xs">
                    Recurs: {getRecurrenceLabel(event)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {event.danceStyles.map((style) => (
                  <Badge key={style} variant="outline" className="text-xs">
                    {style}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/event/${event.slug ?? event.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/organizer/events/${event.id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget(event)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {deleteTarget && (
        <DeleteEventDialog
          eventId={deleteTarget.id}
          eventTitle={deleteTarget.title}
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
