import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLdScript } from "@/components/seo/json-ld";
import { UpcomingEventsList } from "@/components/seo/upcoming-events-list";
import {
  buildItemListJsonLd,
  findStyleBySlug,
  getDistinctDanceStyles,
  SITE_NAME,
} from "@/lib/seo";
import { getFilteredHubListEvents } from "@/lib/home-events";
import { buildPublicPageMetadata, NOINDEX_METADATA } from "@/lib/seo-metadata";
import { DANCE_STYLES } from "@/lib/types";
import { styleSlug } from "@/lib/seo";

/**
 * Styles with listed events, plus the standard style list (the homepage links
 * to e.g. Swing and Ballroom even before an organizer lists one).
 */
function resolveStyle(styles: string[], slug: string): { name: string; listed: boolean } | null {
  const listed = findStyleBySlug(styles, slug);
  if (listed) return { name: listed, listed: true };
  const known = DANCE_STYLES.find((style) => style !== "Other" && styleSlug(style) === slug);
  return known ? { name: known, listed: false } : null;
}

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
  const style = resolveStyle(styles, styleParam);

  if (!style) {
    return { title: "Style Not Found" };
  }
  const styleName = style.name;

  return {
    ...buildPublicPageMetadata({
    title: `${styleName} Dance Events in Michigan`,
    description: `Find upcoming ${styleName} dance events, socials, and classes across Michigan on ${SITE_NAME}.`,
    path: `/events/style/${styleParam}`,
    }),
    // No listings yet: keep the page useful for visitors but out of search results.
    ...(style.listed ? {} : NOINDEX_METADATA),
  };
}

export default async function StyleEventsPage({ params }: StylePageProps) {
  const { style: styleParam } = await params;
  const styles = await getDistinctDanceStyles();
  const style = resolveStyle(styles, styleParam);

  if (!style) {
    notFound();
  }
  const styleName = style.name;

  const events = await getFilteredHubListEvents({ styleSlug: styleParam });

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
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[#CDBDCA]">
          <Link href="/" className="hover:text-[#FF8C83]">
            Home
          </Link>
          {" · "}
          <Link href="/events" className="hover:text-[#FF8C83]">
            Events
          </Link>
        </nav>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF9189]">Dance style</p>
        <h1 className="mt-2 mb-3 font-display text-3xl font-extrabold tracking-tight text-[#FFF1E5] sm:text-4xl">
          {styleName} Dance Events in Michigan
        </h1>
        <p className="mb-6 text-[#D9C6D4]">
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
      <SiteFooter />
    </div>
  );
}
