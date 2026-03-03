import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar } from "lucide-react";
import { OrganizerEventList } from "@/components/events/organizer-event-list";

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

  const serializedEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    startTime: e.startTime.toISOString(),
    venue: e.venue,
    city: e.city,
    danceStyles: e.danceStyles,
  }));

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

      {serializedEvents.length === 0 ? (
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
        <OrganizerEventList initialEvents={serializedEvents} />
      )}
    </div>
  );
}
