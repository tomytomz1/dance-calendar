import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCityIntro } from "@/lib/city-copy";
import { JsonLdScript } from "@/components/seo/json-ld";
import { UpcomingEventsList } from "@/components/seo/upcoming-events-list";
import {
  buildItemListJsonLd,
  citySlug,
  findCityBySlug,
  getDistinctCities,
  SITE_NAME,
} from "@/lib/seo";
import { getFilteredHubListEvents } from "@/lib/home-events";
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
    // Legacy URLs built from unnormalized city text, e.g. /events/city/troy-mi-48083
    const normalizedSlug = citySlug(cityParam.replace(/-/g, " "));
    if (normalizedSlug !== cityParam && findCityBySlug(cities, normalizedSlug)) {
      permanentRedirect(`/events/city/${normalizedSlug}`);
    }
    notFound();
  }

  const events = await getFilteredHubListEvents({ citySlug: cityParam });

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
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[#CDBDCA]">
          <Link href="/" className="hover:text-[#FF8C83]">
            Home
          </Link>
          {" · "}
          <Link href="/events" className="hover:text-[#FF8C83]">
            Events
          </Link>
        </nav>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF9189]">Your city. Your dance floor.</p>
        <h1 className="mt-2 mb-3 font-display text-3xl font-extrabold tracking-tight text-[#FFF1E5] sm:text-4xl">
          Dance Events in {cityName}, Michigan
        </h1>
        <p className="mb-4 leading-relaxed text-[#D9C6D4]">
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
