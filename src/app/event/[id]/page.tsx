import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { EventDateTimeDisplay } from "@/components/events/event-datetime-display";
import { EventCoverImage } from "@/components/events/event-cover-image";
import { Header } from "@/components/layout/header";
import { JsonLdScript } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
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
  normalizeCityName,
  stylePath,
  SITE_NAME,
  SITE_URL,
  type SeoEventRecord,
} from "@/lib/seo";
import { safeHttpOrHttpsUrl } from "@/lib/safe-external-url";
import { danceImageForStyles, organizerImageUrl } from "@/lib/dance-images";
import { getApprovedEventByIdOrSlug, resolveEventOccurrence } from "@/lib/event-detail";
import { normalizeVenueName } from "@/lib/city-name";
import { buildGoogleMapsUrl } from "@/lib/maps-url";
import { EventShareButton } from "@/components/events/event-share-button";
import { SiteFooter } from "@/components/layout/site-footer";

interface EventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ instance?: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { id: idOrSlug } = await params;
  const event = await getApprovedEventByIdOrSlug(idOrSlug);

  if (!event) {
    return { title: "Event Not Found" };
  }

  const city = normalizeCityName(event.city);
  const venue = normalizeVenueName(event.venue);
  const { start } = resolveEventOccurrence(event);
  const path = getEventPath(event);
  const dateLabel = formatEventDateForMeta(start);
  const title = `${event.title} — ${dateLabel} at ${venue}, ${city}`;
  const description =
    event.description?.trim() ||
    `Join us for ${event.title} at ${venue} in ${city}, Michigan on ${dateLabel}.`;

  const image = organizerImageUrl(event.imageUrl);

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
      ...(image ? { images: [{ url: image, alt: event.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const { id: idOrSlug } = await params;
  const { instance: instanceParam } = await searchParams;

  const event = await getApprovedEventByIdOrSlug(idOrSlug);
  if (!event) {
    notFound();
  }

  const { start: displayStart, end: displayEnd } = resolveEventOccurrence(event, instanceParam);
  const city = normalizeCityName(event.city);
  const venue = normalizeVenueName(event.venue);
  const organizerImage = organizerImageUrl(event.imageUrl);
  const safeTicketUrl = safeHttpOrHttpsUrl(event.ticketUrl);

  const seoEvent: SeoEventRecord = {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    venue,
    address: event.address,
    city: event.city,
    danceStyles: event.danceStyles,
    startTime: event.startTime,
    endTime: event.endTime,
    imageUrl: organizerImage,
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
    city,
    latitude: event.latitude,
    longitude: event.longitude,
  });

  const cardClass = "rounded-2xl border border-[#675066] bg-[#1B1624] p-5 sm:p-6";

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLdScript
        data={[
          buildEventJsonLd(seoEvent, {
            instanceStart: displayStart,
            instanceEnd: displayEnd,
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: city, path: cityPath(city) },
            { name: event.title, path: eventPath },
          ]),
        ]}
      />
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <Link
          href="/calendar"
          className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold text-[#E8D6EA] hover:text-[#FF9A93] focus-visible:outline-2 focus-visible:outline-[#FF8179]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to calendar
        </Link>

        <article className="space-y-6">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-[#675066] bg-[#34223B]">
            <EventCoverImage
              src={organizerImage}
              fallbackSrc={danceImageForStyles(event.danceStyles)}
              alt={`${event.title} dance event at ${venue}, ${city}`}
              width={1200}
              height={675}
              loading="eager"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
              labelClassName="bottom-3 right-3"
            />
          </div>

          <header>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-[#FFF1E5] sm:text-4xl">
                {event.title}
              </h1>
              {event.isRecurring && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#B58EB0] px-3 py-1 text-xs font-semibold text-[#F3D9EE]">
                  <Repeat className="h-3 w-3" aria-hidden="true" />
                  Recurring
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {event.danceStyles.map((style) => (
                <Link
                  key={style}
                  href={stylePath(style)}
                  className="rounded-full bg-[#794788] px-3 py-1 text-xs font-semibold text-white hover:bg-[#F46157] hover:text-[#160E18]"
                >
                  {style}
                </Link>
              ))}
            </div>

            <p className="mt-4 text-sm">
              <Link href={cityPath(city)} className="font-semibold text-[#FF8C83] hover:underline">
                More dance events in {city}, Michigan
              </Link>
            </p>
          </header>

          <section className={`${cardClass} space-y-4`} aria-label="When and where">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#F46157]" aria-hidden="true" />
              <p className="font-semibold text-[#FFF1E5]">
                <EventDateTimeDisplay
                  startTime={displayStart.toISOString()}
                  endTime={displayEnd.toISOString()}
                  variant="date"
                />
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#F46157]" aria-hidden="true" />
              <p className="font-semibold text-[#FFF1E5]">
                <EventDateTimeDisplay
                  startTime={displayStart.toISOString()}
                  endTime={displayEnd.toISOString()}
                  variant="time"
                />
                <span className="ml-2 text-xs font-normal text-[#BFAEBD]">Michigan time</span>
              </p>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#F46157]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#FFF1E5]">{venue}</p>
                <p className="text-sm text-[#D9C6D4]">{event.address}</p>
                <p className="text-sm text-[#D9C6D4]">{city}, Michigan</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm font-semibold text-[#FF8C83] hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>

            {event.price && (
              <div className="flex items-start gap-3">
                <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-[#F46157]" aria-hidden="true" />
                <p className="font-semibold text-[#FFF1E5]">{event.price}</p>
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <EventShareButton
              title={event.title}
              venue={venue}
              url={shareUrl}
              className="h-12 flex-1 rounded-full border-[#875D7D]"
            />
            {safeTicketUrl && (
              <Button asChild className="h-12 flex-1 rounded-full font-bold">
                <a href={safeTicketUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  Get tickets
                </a>
              </Button>
            )}
          </div>

          {event.description && (
            <section className={cardClass}>
              <h2 className="mb-3 text-lg font-bold text-[#FFF1E5]">About this event</h2>
              <p className="whitespace-pre-wrap break-words leading-relaxed text-[#E0D0DE]">
                {event.description}
              </p>
            </section>
          )}

          <section className={cardClass}>
            <h2 className="mb-4 text-lg font-bold text-[#FFF1E5]">Organizer</h2>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={event.organizer.image || ""} alt="" />
                <AvatarFallback className="bg-[#4C2B42] text-[#FFF1E5]">
                  {event.organizer.name?.charAt(0).toUpperCase() || "O"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-[#FFF1E5]">{event.organizer.name}</p>
                {event.organizer.bio && (
                  <p className="line-clamp-2 text-sm text-[#D9C6D4]">{event.organizer.bio}</p>
                )}
              </div>
            </div>
          </section>

          <p className="text-xs text-[#A897A8]">
            Event details are provided by the organizer. Photos marked “Illustrative photo” are
            artwork for the dance style, not pictures from this event.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
