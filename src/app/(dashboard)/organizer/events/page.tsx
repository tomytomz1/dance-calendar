import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin, Edit, Eye } from "lucide-react";
import { EVENT_STATUS_LABELS } from "@/lib/types";

export default async function OrganizerEventsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/organizer/events");
  }

  if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const events = await prisma.event.findMany({
    where: {
      organizerId: session.user.id,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default";
      case "PENDING_APPROVAL":
        return "secondary";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Events</h1>
          <p className="text-muted-foreground">
            Manage your dance events
          </p>
        </div>
        {session.user.verified && (
          <Button asChild>
            <Link href="/organizer/events/new">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Link>
          </Button>
        )}
      </div>

      {!session.user.verified && session.user.role !== "ADMIN" && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <p className="text-amber-800 dark:text-amber-200">
              Your organizer account is pending approval. You&apos;ll be able to create events once an admin approves your account.
            </p>
          </CardContent>
        </Card>
      )}

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No events yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first dance event to get started
            </p>
            {session.user.verified && (
              <Button asChild>
                <Link href="/organizer/events/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
