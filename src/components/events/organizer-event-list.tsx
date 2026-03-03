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
                  <Link href={`/event/${event.id}`}>
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
