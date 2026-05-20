import type { MetadataRoute } from "next";
import {
  SITE_URL,
  getApprovedEventsForSitemap,
  getDistinctCities,
  getDistinctDanceStyles,
  getEventPath,
  citySlug,
  styleSlug,
} from "@/lib/seo";

const MAX_URLS = 50_000;

/** Generated at request time so build does not require a live database. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let events: Awaited<ReturnType<typeof getApprovedEventsForSitemap>> = [];
  let cities: string[] = [];
  let styles: string[] = [];

  try {
    [events, cities, styles] = await Promise.all([
      getApprovedEventsForSitemap(),
      getDistinctCities(),
      getDistinctDanceStyles(),
    ]);
  } catch (error) {
    console.error("sitemap: database unavailable, emitting core URLs only", error);
  }

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/events`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  for (const event of events) {
    entries.push({
      url: `${SITE_URL}${getEventPath(event)}`,
      lastModified: event.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const city of cities) {
    entries.push({
      url: `${SITE_URL}/events/city/${citySlug(city)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const style of styles) {
    entries.push({
      url: `${SITE_URL}/events/style/${styleSlug(style)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries.slice(0, MAX_URLS);
}
