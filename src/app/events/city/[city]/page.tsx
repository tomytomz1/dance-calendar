import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCityIntro } from "@/lib/city-copy";
import { JsonLdScript } from "@/components/seo/json-ld";
import { UpcomingEventsList } from "@/components/seo/upcoming-events-list";
import {
  buildItemListJsonLd,
  findCityBySlug,
  getDistinctCities,
  getUpcomingApprovedEvents,
  SITE_NAME,
} from "@/lib/seo";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";

export const revalidate = 600;
export const dynamicParams = true;

interface CityPageProps {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { city: cityParam } = await params;
  const cities = await getDistinctCities();
  const cityName = findCityBySlug(cities, cityParam);

  if (!cityName) {
    return { title: "City Not Found" };
  }

  return buildPublicPageMetadata({
    title: `Dance Events in ${cityName}, Michigan`,
    description: `Upcoming salsa, bachata, swing, and ballroom dance events in ${cityName}, Michigan. Updated listings on ${SITE_NAME}.`,
    path: `/events/city/${cityParam}`,
  });
}

export default async function CityEventsPage({ params }: CityPageProps) {
  const { city: cityParam } = await params;
  const cities = await getDistinctCities();
  const cityName = findCityBySlug(cities, cityParam);

  if (!cityName) {
    notFound();
  }

  const events = await getUpcomingApprovedEvents({
    citySlugParam: cityParam,
    limit: 200,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLdScript
        data={buildItemListJsonLd(
          events,
          `Dance events in ${cityName}, Michigan`
        )}
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          {" · "}
          <Link href="/events" className="hover:text-primary">
            Events
          </Link>
        </nav>
        <h1 className="text-2xl font-bold mb-2">
          Dance Events in {cityName}, Michigan
        </h1>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          {getCityIntro(cityName, cityParam)}
        </p>
        <UpcomingEventsList
          events={events}
          heading={`Upcoming events in ${cityName}`}
          showHubLinks
          listId="city-events-list"
        />
      </main>
      <SiteFooter />
    </div>
  );
}
