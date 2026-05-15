import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EventDateTimeDisplay } from "@/components/events/event-datetime-display";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Ticket,
  Repeat,
  ArrowLeft,
} from "lucide-react";

interface EventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ instance?: string }>;
}

export async function generateMetadata({ params }: EventPageProps) {
  const { id: idOrSlug } = await params;
  const rows = await prisma.$queryRaw<
    { id: string; title: string; description: string | null; venue: string }[]
  >`SELECT "id", "title", "description", "venue"
    FROM "Event"
    WHERE ("id" = ${idOrSlug} OR "slug" = ${idOrSlug})
      AND "status" = 'APPROVED'
    LIMIT 1`;

  const event = rows[0];

  if (!event) {
    return { title: "Event Not Found" };
  }

  return {
    title: `${event.title} | Dance Calendar`,
    description: event.description || `Dance event at ${event.venue}`,
  };
}

export default async function EventPage({
  params,
  searchParams,
}: EventPageProps) {
  const { id: idOrSlug } = await params;
  const { instance: instanceParam } = await searchParams;

  const idRows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "Event"
    WHERE ("id" = ${idOrSlug} OR "slug" = ${idOrSlug})
      AND "status" = 'APPROVED'
    LIMIT 1
  `;

  const canonical = idRows[0];

  if (!canonical) {
    notFound();
  }

  const event = await prisma.event.findUnique({
    where: { id: canonical.id },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
        },
      },
      recurrenceRule: true,
    },
  });

  if (!event) {
    notFound();
  }

  if (event.status !== "APPROVED") {
    notFound();
  }

  const useInstanceTime =
    event.isRecurring &&
    instanceParam &&
    !Number.isNaN(Date.parse(instanceParam));

  const instanceStart = instanceParam ? new Date(instanceParam) : null;
  const displayStart = useInstanceTime && instanceStart
    ? instanceStart
    : event.startTime;
  const displayEnd =
    useInstanceTime && instanceStart
      ? new Date(
          instanceStart.getTime() +
            (event.endTime.getTime() - event.startTime.getTime())
        )
      : event.endTime;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Link>
        </Button>

        <div className="space-y-6">
          {event.imageUrl && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted relative">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl font-bold">{event.title}</h1>
              {event.isRecurring && (
                <Badge variant="secondary">
                  <Repeat className="w-3 h-3 mr-1" />
                  Recurring
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {event.danceStyles.map((style) => (
                <Badge key={style}>{style}</Badge>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">
                    <EventDateTimeDisplay
                      startTime={displayStart.toISOString()}
                      endTime={displayEnd.toISOString()}
                      variant="date"
                    />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">
                    <EventDateTimeDisplay
                      startTime={displayStart.toISOString()}
                      endTime={displayEnd.toISOString()}
                      variant="time"
                    />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{event.venue}</p>
                  <p className="text-sm text-muted-foreground">{event.address}</p>
                  <p className="text-sm text-muted-foreground">{event.city}</p>
                </div>
              </div>

              {event.price && (
                <div className="flex items-start gap-3">
                  <Ticket className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{event.price}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {event.description && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold mb-2">About this event</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold mb-4">Organizer</h2>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={event.organizer.image || ""} />
                  <AvatarFallback>
                    {event.organizer.name?.charAt(0).toUpperCase() || "O"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{event.organizer.name}</p>
                  {event.organizer.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.organizer.bio}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {event.ticketUrl && (
            <Button asChild className="w-full h-12">
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get Tickets
              </a>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
