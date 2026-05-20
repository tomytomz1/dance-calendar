"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CalendarEvent } from "@/lib/types";
import { EventCalendarWrapper } from "@/components/calendar/event-calendar-wrapper";
import { UpcomingEventsList } from "@/components/seo/upcoming-events-list";
import type { SeoEventRecord } from "@/lib/seo";

const TAB_STORAGE_PREFIX = "home-view-tab";
/** Tailwind `md` — matches mobile vs desktop layout breakpoints */
const DESKTOP_MEDIA = "(min-width: 768px)";

type HomeTab = "list" | "calendar";

function isDesktopViewport(): boolean {
  return window.matchMedia(DESKTOP_MEDIA).matches;
}

function getTabStorageKey(): string {
  return isDesktopViewport()
    ? `${TAB_STORAGE_PREFIX}-desktop`
    : `${TAB_STORAGE_PREFIX}-mobile`;
}

function getDefaultTabForViewport(): HomeTab {
  return isDesktopViewport() ? "calendar" : "list";
}

function readSavedTab(): HomeTab | null {
  const saved = localStorage.getItem(getTabStorageKey());
  if (saved === "calendar" || saved === "list") return saved;
  return null;
}

interface HomeViewTabsProps {
  calendarEvents: CalendarEvent[];
  listEvents: SeoEventRecord[];
  calendarError?: string;
  CalendarErrorComponent: React.ComponentType;
}

export function HomeViewTabs({
  calendarEvents,
  listEvents,
  calendarError,
  CalendarErrorComponent,
}: HomeViewTabsProps) {
  const [tab, setTab] = useState<HomeTab>("list");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setTab(readSavedTab() ?? getDefaultTabForViewport());
    } catch {
      setTab(getDefaultTabForViewport());
    }
    setHydrated(true);

    const mq = window.matchMedia(DESKTOP_MEDIA);
    const onViewportChange = () => {
      try {
        setTab(readSavedTab() ?? getDefaultTabForViewport());
      } catch {
        setTab(getDefaultTabForViewport());
      }
    };
    mq.addEventListener("change", onViewportChange);
    return () => mq.removeEventListener("change", onViewportChange);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(getTabStorageKey(), tab);
    } catch {
      // ignore
    }
  }, [tab, hydrated]);

  if (!hydrated) {
    return (
      <div className="flex flex-col flex-1 w-full">
        <div className="px-4 pt-3 flex justify-center" aria-hidden>
          <div className="h-11 w-full max-w-sm rounded-lg bg-muted/80 animate-pulse" />
        </div>
        <div className="mx-4 mt-3 min-h-[40vh] rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    if (value === "list" || value === "calendar") setTab(value);
  };

  return (
    <Tabs
      value={tab}
      onValueChange={handleTabChange}
      className="flex flex-col flex-1 w-full"
    >
      <div className="px-4 pt-3 flex justify-center">
        <TabsList
          className="grid h-11 w-full max-w-sm grid-cols-2 gap-1 p-1"
          aria-label="Home event views"
        >
          <TabsTrigger
            value="list"
            className="order-1 h-full rounded-md px-3 py-0 text-sm font-medium md:order-2"
          >
            List
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="order-2 h-full rounded-md px-3 py-0 text-sm font-medium md:order-1"
          >
            Calendar
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value="calendar"
        className="mt-0 data-[state=inactive]:hidden"
      >
        <div className="w-full max-w-full overflow-x-hidden md:min-h-[70vh] md:flex md:flex-col md:overflow-hidden">
          {calendarError ? (
            <CalendarErrorComponent />
          ) : (
            <EventCalendarWrapper events={calendarEvents} />
          )}
        </div>
      </TabsContent>
      <TabsContent
        value="list"
        className="mt-0 px-4 pb-8 max-w-3xl mx-auto w-full data-[state=inactive]:hidden"
      >
        <UpcomingEventsList
          events={listEvents}
          heading="Upcoming events"
          showHubLinks
          listId="home-tab-list"
        />
      </TabsContent>
    </Tabs>
  );
}
