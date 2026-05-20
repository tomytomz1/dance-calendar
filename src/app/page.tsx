import { Suspense } from "react";
import type { Metadata } from "next";
import { addMonths, endOfDay } from "date-fns";
import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CalendarLoadError } from "@/components/calendar/calendar-load-error";
import { HomeHero } from "@/components/home/home-hero";
import { HomeViewTabs } from "@/components/home/home-view-tabs";
import { JsonLdScript } from "@/components/seo/json-ld";
import { buildItemListJsonLd, SITE_NAME } from "@/lib/seo";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";
import { getHomePageEvents } from "@/lib/home-events";
import type { SeoEventRecord } from "@/lib/seo";

function getTopCitiesFromEvents(
  events: SeoEventRecord[],
  limit = 6
): { cities: string[]; counts: Record<string, number> } {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const city = e.city?.trim();
    if (!city) continue;
    counts[city] = (counts[city] ?? 0) + 1;
  }
  const cities = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([city]) => city);
  return { cities, counts };
}

/** Cap JSON-LD item list size; list tab shows the full set. */
const JSON_LD_LIST_LIMIT = 50;

export const revalidate = 300;

export const metadata: Metadata = buildPublicPageMetadata({
  title: `${SITE_NAME} — Dance Events in Michigan`,
  description:
    "Find salsa, bachata, kizomba, swing, and ballroom dance events across Michigan. Browse the calendar or see upcoming socials and classes listed below.",
  path: "/",
});

function CalendarSkeleton() {
  return (
    <div className="flex flex-col min-h-[50vh] p-4">
      <div className="h-7 w-48 bg-muted animate-pulse rounded mb-4" />
      <div className="flex-1 grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const { calendarEvents, listEvents, error } = await getHomePageEvents();
  const now = new Date();
  const listRangeEnd = endOfDay(addMonths(now, 1));
  const upcomingListEvents = listEvents.filter(
    (e) => e.endTime >= now && e.startTime <= listRangeEnd
  );
  const jsonLdEvents = upcomingListEvents.slice(0, JSON_LD_LIST_LIMIT);

  const { cities: topCities, counts: cityCounts } =
    getTopCitiesFromEvents(upcomingListEvents);

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLdScript
        data={buildItemListJsonLd(
          jsonLdEvents,
          "Upcoming dance events in Michigan"
        )}
      />
      <Header />
      <main className="flex-1 flex flex-col">
        <HomeHero
          eventCount={upcomingListEvents.length}
          topCities={topCities}
          cityCounts={cityCounts}
        />
        <Suspense fallback={<CalendarSkeleton />}>
          <HomeViewTabs
            calendarEvents={calendarEvents}
            listEvents={upcomingListEvents}
            calendarError={error}
            CalendarErrorComponent={CalendarLoadError}
          />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
