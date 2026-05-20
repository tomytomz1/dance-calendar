import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { safeHttpOrHttpsUrl } from "@/lib/safe-external-url";
import { EventDateTimeDisplay } from "@/components/events/event-datetime-display";
import { Header } from "@/components/layout/header";
import { JsonLdScript } from "@/components/seo/json-ld";
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
import {
  buildBreadcrumbJsonLd,
  buildEventJsonLd,
  cityPath,
  formatEventDateForMeta,
  getEventPath,
  stylePath,
  SITE_NAME,
  SITE_URL,
  type SeoEventRecord,
} from "@/lib/seo";
import { buildGoogleMapsUrl } from "@/lib/maps-url";
import { EventShareButton } from "@/components/events/event-share-button";
import { SiteFooter } from "@/components/layout/site-footer";

interface EventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ instance?: string }>;
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { id: idOrSlug } = await params;
  const rows = await prisma.$queryRaw<
    {
      id: string;
      slug: string | null;
      title: string;
      description: string | null;
      venue: string;
      city: string;
      startTime: Date;
      imageUrl: string | null;
    }[]
  >`SELECT "id", "slug", "title", "description", "venue", "city", "startTime", "imageUrl"
    FROM "Event"
    WHERE ("id" = ${idOrSlug} OR "slug" = ${idOrSlug})
      AND "status" = 'APPROVED'
    LIMIT 1`;

  const event = rows[0];

  if (!event) {
    return { title: "Event Not Found" };
  }

  const path = getEventPath(event);
  const dateLabel = formatEventDateForMeta(new Date(event.startTime));
  const title = `${event.title} — ${dateLabel} at ${event.venue}, ${event.city}`;
  const description =
    event.description?.trim() ||
    `Join us for ${event.title} at ${event.venue} in ${event.city}, Michigan on ${dateLabel}.`;

  const safeImage = safeHttpOrHttpsUrl(event.imageUrl);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: SITE_NAME,
      ...(safeImage ? { images: [{ url: safeImage, alt: event.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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

  if (!event || event.status !== "APPROVED") {
    notFound();
  }

  const useInstanceTime =
    event.isRecurring &&
    instanceParam &&
    !Number.isNaN(Date.parse(instanceParam));

  const instanceStart = instanceParam ? new Date(instanceParam) : null;
  const displayStart =
    useInstanceTime && instanceStart ? instanceStart : event.startTime;
  const displayEnd =
    useInstanceTime && instanceStart
      ? new Date(
          instanceStart.getTime() +
            (event.endTime.getTime() - event.startTime.getTime())
        )
      : event.endTime;

  const safeImageUrl = safeHttpOrHttpsUrl(event.imageUrl);
  const safeTicketUrl = safeHttpOrHttpsUrl(event.ticketUrl);

  const seoEvent: SeoEventRecord = {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    venue: event.venue,
    address: event.address,
    city: event.city,
    danceStyles: event.danceStyles,
    startTime: event.startTime,
    endTime: event.endTime,
    imageUrl: event.imageUrl,
    ticketUrl: event.ticketUrl,
    price: event.price,
    status: event.status,
    updatedAt: event.updatedAt,
    organizer: { name: event.organizer.name },
  };

  const eventPath = getEventPath(event);
  const shareUrl = `${SITE_URL}${eventPath}`;
  const mapsUrl = buildGoogleMapsUrl({
    address: event.address,
    city: event.city,
    latitude: event.latitude,
    longitude: event.longitude,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLdScript
        data={[
          buildEventJsonLd(seoEvent, {
            instanceStart: displayStart,
            instanceEnd: displayEnd,
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: event.city, path: cityPath(event.city) },
            { name: event.title, path: eventPath },
          ]),
        ]}
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Link>
        </Button>

        <div className="space-y-6">
          {safeImageUrl && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted relative">
              <Image
                src={safeImageUrl}
                alt={`${event.title} dance event at ${event.venue}, ${event.city}`}
                fill
                className="object-cover"
                sizes="(max-width: 672px) 100vw, 672px"
                unoptimized
                priority
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
                <Badge key={style} variant="outline" asChild>
                  <Link href={stylePath(style)}>{style}</Link>
                </Badge>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              <Link href={cityPath(event.city)} className="text-primary hover:underline">
                More dance events in {event.city}, Michigan
              </Link>
            </p>
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
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-1 inline-block"
                  >
                    Open in Google Maps
                  </a>
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

          <div className="flex flex-col sm:flex-row gap-2">
            <EventShareButton
              title={event.title}
              venue={event.venue}
              url={shareUrl}
              className="flex-1"
            />
            {safeTicketUrl && (
              <Button asChild className="flex-1 h-12">
                <a
                  href={safeTicketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Tickets
                </a>
              </Button>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
