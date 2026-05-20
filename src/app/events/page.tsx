import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";
import { EventCountBanner } from "@/components/seo/event-count-banner";
import { JsonLdScript } from "@/components/seo/json-ld";
import { UpcomingEventsList } from "@/components/seo/upcoming-events-list";
import {
  buildItemListJsonLd,
  getEventsIndexPageData,
  cityPath,
  stylePath,
  SITE_NAME,
} from "@/lib/seo";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";

export const revalidate = 600;

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Upcoming Dance Events in Michigan",
  description:
    "Full list of upcoming salsa, bachata, swing, and ballroom dance events across Michigan cities.",
  path: "/events",
});

export default async function EventsIndexPage() {
  // Single DB round-trip (not Promise.all) — see getEventsIndexPageData in lib/seo.ts
  const { events, cities, styles } = await getEventsIndexPageData(200);

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLdScript
        data={buildItemListJsonLd(events, "Upcoming dance events in Michigan")}
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">
          Upcoming Dance Events in Michigan
        </h1>
        <p className="text-muted-foreground mb-2">
          Find socials, classes, and parties on {SITE_NAME}. Browse by city or
          dance style below.
        </p>
        <div className="mb-6">
          <EventCountBanner count={events.length} />
        </div>

        {(cities.length > 0 || styles.length > 0) && (
          <nav className="mb-8 space-y-4" aria-label="Browse events">
            {cities.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold mb-2">By city</h2>
                <ul className="flex flex-wrap gap-2 text-sm">
                  {cities.map((city) => (
                    <li key={city}>
                      <Link
                        href={cityPath(city)}
                        className="text-primary hover:underline px-2 py-1 rounded-md bg-muted"
                      >
                        {city}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {styles.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold mb-2">By dance style</h2>
                <ul className="flex flex-wrap gap-2 text-sm">
                  {styles.map((style) => (
                    <li key={style}>
                      <Link
                        href={stylePath(style)}
                        className="text-primary hover:underline px-2 py-1 rounded-md bg-muted"
                      >
                        {style}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>
        )}

        <UpcomingEventsList
          events={events}
          heading="All upcoming events"
          showHubLinks
          listId="events-index-list"
        />
      </main>
      <SiteFooter />
    </div>
  );
}
