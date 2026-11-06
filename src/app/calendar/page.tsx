import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CalendarExplorer } from "@/components/calendar/calendar-explorer";
import { getHomePageEvents } from "@/lib/home-events";
import { buildPublicPageMetadata } from "@/lib/seo-metadata";

export const revalidate = 300;
export const metadata: Metadata = buildPublicPageMetadata({
  title: "Michigan Dance Calendar — Salsa, Bachata, Swing & Ballroom",
  description: "Explore Michigan dance events on an interactive month and week calendar. Filter socials, classes, and parties by city or dance style.",
  path: "/calendar",
});

export default async function DanceCalendarPage() {
  const { calendarEvents, error } = await getHomePageEvents();
  return (
    <div className="flex min-h-screen flex-col">
      <Header/>
      <main className="flex-1">
        <CalendarExplorer events={calendarEvents} error={error}/>
      </main>
      <SiteFooter/>
    </div>
  );
}
