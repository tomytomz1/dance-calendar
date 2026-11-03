import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "About",
  description: `About ${SITE_NAME} — Michigan's dance event calendar for salsa, bachata, swing, and more.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <LegalPageShell title={`About ${SITE_NAME}`}>
      <p>
        {SITE_NAME} is Michigan&apos;s community calendar for social dance
        events—salsa, bachata, kizomba, swing, ballroom, and more.
      </p>
      <h2>For dancers</h2>
      <p>
        Browse upcoming events by date, city, or style. Subscribe to email alerts
        for your favorite cities and dance genres.
      </p>
      <h2>For organizers</h2>
      <p>
        Register as an organizer, and once your account is approved, every
        event you submit appears on the public calendar and in search engines
        right away.
      </p>
      <h2>Quality</h2>
      <p>
        Every organizer account is reviewed before it can post, so dancers see
        events from real local organizers with accurate dates, venues, and
        links.
      </p>
    </LegalPageShell>
  );
}
