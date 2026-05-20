import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { JsonLdScript } from "@/components/seo/json-ld";
import { UpcomingEventsList } from "@/components/seo/upcoming-events-list";
import {
  buildItemListJsonLd,
  findStyleBySlug,
  getDistinctDanceStyles,
  getUpcomingApprovedEvents,
  SITE_NAME,
} from "@/lib/seo";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";

export const revalidate = 600;
export const dynamicParams = true;

interface StylePageProps {
  params: Promise<{ style: string }>;
}

export async function generateMetadata({
  params,
}: StylePageProps): Promise<Metadata> {
  const { style: styleParam } = await params;
  const styles = await getDistinctDanceStyles();
  const styleName = findStyleBySlug(styles, styleParam);

  if (!styleName) {
    return { title: "Style Not Found" };
  }

  return buildPublicPageMetadata({
    title: `${styleName} Dance Events in Michigan`,
    description: `Find upcoming ${styleName} dance events, socials, and classes across Michigan on ${SITE_NAME}.`,
    path: `/events/style/${styleParam}`,
  });
}

export default async function StyleEventsPage({ params }: StylePageProps) {
  const { style: styleParam } = await params;
  const styles = await getDistinctDanceStyles();
  const styleName = findStyleBySlug(styles, styleParam);

  if (!styleName) {
    notFound();
  }

  const events = await getUpcomingApprovedEvents({
    styleSlugParam: styleParam,
    limit: 200,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLdScript
        data={buildItemListJsonLd(
          events,
          `${styleName} dance events in Michigan`
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
          {styleName} Dance Events in Michigan
        </h1>
        <p className="text-muted-foreground mb-6">
          Browse upcoming {styleName} nights and socials statewide on{" "}
          {SITE_NAME}.
        </p>
        <UpcomingEventsList
          events={events}
          heading={`Upcoming ${styleName} events`}
          showHubLinks
          listId="style-events-list"
        />
      </main>
    </div>
  );
}
