import { cache } from "react";
import { slugify } from "@/lib/slug";
import { safeHttpOrHttpsUrl } from "@/lib/safe-external-url";
import { prisma } from "@/lib/prisma";
import { generateRecurrenceInstances } from "@/lib/recurrence";
import { tryDb, withDbRetry } from "@/lib/with-db-retry";

export const SITE_NAME = "MichiganDance.Life";

const DEFAULT_SITE_URL = "https://michigandance.life";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  DEFAULT_SITE_URL
).replace(/\/$/, "");

export type SeoEventRecord = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  venue: string;
  address: string;
  city: string;
  danceStyles: string[];
  startTime: Date;
  endTime: Date;
  imageUrl: string | null;
  ticketUrl: string | null;
  price: string | null;
  status: string;
  updatedAt: Date;
  organizer: { name: string | null };
  /** Unique key when this row is one occurrence of a recurring event */
  instanceKey?: string;
};

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function getEventPath(event: { id: string; slug: string | null }): string {
  return `/event/${event.slug ?? event.id}`;
}

export { slugify };

export function citySlug(city: string): string {
  return slugify(city);
}

export function styleSlug(style: string): string {
  return slugify(style);
}

export function cityPath(city: string): string {
  return `/events/city/${citySlug(city)}`;
}

export function stylePath(style: string): string {
  return `/events/style/${styleSlug(style)}`;
}

export function formatEventDateForMeta(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Detroit",
  });
}

function mapEventStatus(status: string): string {
  if (status === "CANCELLED") return "https://schema.org/EventCancelled";
  return "https://schema.org/EventScheduled";
}

export function buildEventJsonLd(
  event: SeoEventRecord,
  options?: { instanceStart?: Date; instanceEnd?: Date }
) {
  const start = options?.instanceStart ?? event.startTime;
  const end = options?.instanceEnd ?? event.endTime;
  const image = safeHttpOrHttpsUrl(event.imageUrl);
  const ticketUrl = safeHttpOrHttpsUrl(event.ticketUrl);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description:
      event.description?.trim() ||
      `${event.title} at ${event.venue} in ${event.city}, Michigan.`,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    eventStatus: mapEventStatus(event.status),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.address,
        addressLocality: event.city,
        addressRegion: "MI",
        addressCountry: "US",
      },
    },
    organizer: {
      "@type": "Organization",
      name: event.organizer.name || SITE_NAME,
    },
    url: absoluteUrl(getEventPath(event)),
  };

  if (image) {
    jsonLd.image = [image];
  }

  if (ticketUrl || event.price) {
    jsonLd.offers = {
      "@type": "Offer",
      url: ticketUrl ?? absoluteUrl(getEventPath(event)),
      price: event.price || "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    };
  }

  return jsonLd;
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/michigandancelife-header-logo.png"),
    description:
      "Discover salsa, bachata, swing, ballroom, and social dance events across Michigan.",
    areaServed: {
      "@type": "State",
      name: "Michigan",
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Michigan's dance event calendar — find salsa, bachata, kizomba, swing, and ballroom nights near you.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildItemListJsonLd(
  events: SeoEventRecord[],
  listName: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: events.length,
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(getEventPath(event)),
      name: event.title,
    })),
  };
}

const seoEventSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  venue: true,
  address: true,
  city: true,
  danceStyles: true,
  startTime: true,
  endTime: true,
  imageUrl: true,
  ticketUrl: true,
  price: true,
  status: true,
  updatedAt: true,
  isRecurring: true,
  organizer: { select: { name: true } },
  recurrenceRule: true,
} as const;

function withNextOccurrence(
  event: SeoEventRecord & {
    isRecurring: boolean;
    recurrenceRule: {
      frequency: string;
      interval: number;
      daysOfWeek: number[];
      until: Date | null;
      count: number | null;
      monthlyPattern: string;
      monthlyDayOfWeek: number | null;
      monthlyWeeks: number[];
    } | null;
  }
): SeoEventRecord {
  if (!event.isRecurring || !event.recurrenceRule) {
    return event;
  }

  const rule = event.recurrenceRule;
  const instances = generateRecurrenceInstances(event.startTime, event.endTime, {
    frequency: rule.frequency as "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY",
    interval: rule.interval,
    daysOfWeek: rule.daysOfWeek,
    until: rule.until ?? undefined,
    count: rule.count ?? undefined,
    monthlyPattern: (rule.monthlyPattern as "BY_DATE" | "BY_WEEKDAY") ?? "BY_DATE",
    monthlyDayOfWeek: rule.monthlyDayOfWeek ?? undefined,
    monthlyWeeks: rule.monthlyWeeks ?? [],
  });

  const now = new Date();
  const next = instances.find((i) => i.endTime >= now);
  if (!next) return event;

  return {
    ...event,
    startTime: next.startTime,
    endTime: next.endTime,
  };
}

async function queryUpcomingApprovedEvents(options?: {
  limit?: number;
  citySlugParam?: string;
  styleSlugParam?: string;
}): Promise<SeoEventRecord[]> {
  const limit = options?.limit ?? 500;
  const now = new Date();

  const events = await prisma.event.findMany({
    where: {
      status: "APPROVED",
      endTime: { gte: now },
    },
    select: seoEventSelect,
    orderBy: { startTime: "asc" },
    take: limit * 3,
  });

  let filtered = events as SeoEventRecord[];

  if (options?.citySlugParam) {
    filtered = filtered.filter(
      (e) => citySlug(e.city) === options.citySlugParam
    );
  }

  if (options?.styleSlugParam) {
    filtered = filtered.filter((e) =>
      e.danceStyles.some((s) => styleSlug(s) === options.styleSlugParam)
    );
  }

  const withNext = (
    filtered as (SeoEventRecord & {
      isRecurring: boolean;
      recurrenceRule: Parameters<typeof withNextOccurrence>[0]["recurrenceRule"];
    })[]
  )
    .map(withNextOccurrence)
    .filter((e) => e.endTime >= now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return withNext.slice(0, limit);
}

export function deriveCitiesFromEvents(
  events: Pick<SeoEventRecord, "city">[]
): string[] {
  const set = new Set<string>();
  for (const e of events) {
    if (e.city?.trim()) set.add(e.city.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function deriveDanceStylesFromEvents(
  events: Pick<SeoEventRecord, "danceStyles">[]
): string[] {
  const set = new Set<string>();
  for (const e of events) {
    for (const style of e.danceStyles) {
      if (style?.trim()) set.add(style.trim());
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export const getUpcomingApprovedEvents = cache(
  async (options?: {
    limit?: number;
    citySlugParam?: string;
    styleSlugParam?: string;
  }): Promise<SeoEventRecord[]> =>
    withDbRetry(
      "getUpcomingApprovedEvents",
      () => queryUpcomingApprovedEvents(options),
      []
    )
);

/** One DB round-trip for /events index (avoids parallel Prisma calls when Neon is down). */
export async function getEventsIndexPageData(limit = 200): Promise<{
  events: SeoEventRecord[];
  cities: string[];
  styles: string[];
}> {
  const result = await tryDb("getEventsIndexPageData", async () => {
    const events = await queryUpcomingApprovedEvents({ limit });
    return {
      events,
      cities: deriveCitiesFromEvents(events),
      styles: deriveDanceStylesFromEvents(events),
    };
  });

  if (!result.ok) {
    return { events: [], cities: [], styles: [] };
  }

  return result.data;
}

export const getDistinctCities = cache(async (): Promise<string[]> =>
  withDbRetry("getDistinctCities", async () => {
    const rows = await prisma.event.findMany({
      where: { status: "APPROVED" },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    });
    return rows.map((r) => r.city).filter(Boolean);
  }, [])
);

export const getDistinctDanceStyles = cache(async (): Promise<string[]> =>
  withDbRetry("getDistinctDanceStyles", async () => {
    const rows = await prisma.event.findMany({
      where: { status: "APPROVED" },
      select: { danceStyles: true },
    });
    const set = new Set<string>();
    for (const row of rows) {
      for (const style of row.danceStyles) {
        if (style?.trim()) set.add(style.trim());
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [])
);

export const getApprovedEventsForSitemap = cache(async (): Promise<
  Pick<SeoEventRecord, "id" | "slug" | "updatedAt" | "city" | "danceStyles">[]
> =>
  withDbRetry("getApprovedEventsForSitemap", () =>
    prisma.event.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
        city: true,
        danceStyles: true,
      },
    })
  , [])
);

export function findCityBySlug(
  cities: string[],
  slugParam: string
): string | undefined {
  return cities.find((c) => citySlug(c) === slugParam);
}

export function findStyleBySlug(
  styles: string[],
  slugParam: string
): string | undefined {
  return styles.find((s) => styleSlug(s) === slugParam);
}
