"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CalendarEvent } from "@/lib/types";
import { EventCalendarWrapper } from "@/components/calendar/event-calendar-wrapper";
import { UpcomingEventsList } from "@/components/seo/upcoming-events-list";
import type { SeoEventRecord } from "@/lib/seo";

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
  const [tab, setTab] = useState("calendar");

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1">
      <TabsList className="mx-4 mt-2 grid w-auto grid-cols-2 max-w-xs">
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="list">List</TabsTrigger>
      </TabsList>
      <TabsContent value="calendar" className="flex-1 mt-0 data-[state=inactive]:hidden">
        <div className="min-h-[50vh] md:min-h-[calc(100vh-120px)]">
          {calendarError ? (
            <CalendarErrorComponent />
          ) : (
            <EventCalendarWrapper events={calendarEvents} />
          )}
        </div>
      </TabsContent>
      <TabsContent value="list" className="mt-0 px-4 pb-8 data-[state=inactive]:hidden">
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
