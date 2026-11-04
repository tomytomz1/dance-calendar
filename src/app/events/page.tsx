import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";
import { EventCountBanner } from "@/components/seo/event-count-banner";
import { JsonLdScript } from "@/components/seo/json-ld";
import { UpcomingEventsList } from "@/components/seo/upcoming-events-list";
import {
  buildItemListJsonLd,
  cityPath,
  stylePath,
  SITE_NAME,
} from "@/lib/seo";
import { getEventsIndexPageData } from "@/lib/home-events";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";

export const revalidate = 600;

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Upcoming Dance Events in Michigan",
  description:
    "Full list of upcoming salsa, bachata, swing, and ballroom dance events across Michigan cities.",
  path: "/events",
});

export default async function EventsIndexPage() {
  // Same expanded upcoming list as homepage — see getEventsIndexPageData in lib/home-events.ts
  const { events, cities, styles } = await getEventsIndexPageData();

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLdScript
        data={buildItemListJsonLd(events, "Upcoming dance events in Michigan")}
      />
      <Header />
      <main className="flex-1">
        <header className="relative border-b border-[#70516B] bg-[#1C1625]">
          <div className="absolute inset-0 bg-[url('/dance/event-salsa.webp')] bg-cover bg-center opacity-20" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#11101D] via-[#11101D]/90 to-[#11101D]/55" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF9189]">Make your next night unforgettable</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-[#FFF1E5] sm:text-5xl">Upcoming Dance Events in Michigan</h1>
            <p className="mt-3 max-w-xl text-[#E3D6E1]">
              Explore real socials, classes, and dance parties on {SITE_NAME}.
              Find your next dance floor by city or dance style.
            </p>
            <div className="mt-5"><EventCountBanner count={events.length} /></div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">

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
                        className="inline-flex min-h-9 items-center rounded-full border border-[#8C6686] bg-[#2B1F36] px-4 py-2 font-semibold text-[#FFF1E5] hover:border-[#F46157] hover:text-[#FF9189]"
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
                        className="inline-flex min-h-9 items-center rounded-full border border-[#8C6686] bg-[#2B1F36] px-4 py-2 font-semibold text-[#FFF1E5] hover:border-[#F46157] hover:text-[#FF9189]"
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
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
