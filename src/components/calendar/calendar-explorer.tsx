"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Filter, MapPin, RotateCcw } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import { EventCalendarWrapper } from "@/components/calendar/event-calendar-wrapper";
import { CalendarLoadError } from "@/components/calendar/calendar-load-error";

interface CalendarExplorerProps {
  events: CalendarEvent[];
  error?: string;
}

export function CalendarExplorer({ events, error }: CalendarExplorerProps) {
  const [city, setCity] = useState("");
  const [style, setStyle] = useState("");
  const [loadedAt] = useState(() => Date.now());
  const cities = useMemo(() => Array.from(new Set(events.map(event => event.city).filter(Boolean))).sort(), [events]);
  const styles = useMemo(() => Array.from(new Set(events.flatMap(event => event.danceStyles))).sort(), [events]);
  const visibleEvents = useMemo(() => events.filter(event =>
    (!city || event.city === city) &&
    (!style || event.danceStyles.includes(style))
  ), [events, city, style]);
  const upcomingCount = useMemo(
    () => visibleEvents.filter(event => new Date(event.end).getTime() >= loadedAt).length,
    [visibleEvents, loadedAt]
  );
  const hasFilters = Boolean(city || style);

  const selectClasses = "h-12 w-full appearance-none rounded-full border border-[#755572] bg-[#23192D] px-5 pr-10 text-sm font-semibold text-[#FFF1E5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F46157]";

  return (
    <>
      <section className="relative border-b border-[#664660] bg-[#171322]">
        <div className="absolute inset-0 bg-[url('/dance/hero-desktop.webp')] bg-cover bg-center opacity-35" aria-hidden="true"/>
        <div className="absolute inset-0 bg-gradient-to-r from-[#11101D] via-[#11101D]/90 to-[#11101D]/55" aria-hidden="true"/>
        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-14 sm:px-8 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF9189]">Find your next dance night</p>
          <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight text-[#FFF1E5] sm:text-6xl">Dance Calendar</h1>
          <p className="mt-3 max-w-xl text-base text-[#EEE1EA] sm:text-lg">Browse real socials, classes &amp; dance nights across Michigan. Pick your city and style to narrow the calendar.</p>
          <div className="mt-8 grid gap-3 rounded-[24px] border border-[#805C78] bg-[#211A2D]/85 p-4 shadow-xl backdrop-blur md:grid-cols-[1fr_1fr_auto] md:items-center">
            <label className="relative block">
              <span className="sr-only">Choose a city</span>
              <MapPin className="pointer-events-none absolute right-4 top-4 text-[#F46157]" size={18}/>
              <select className={selectClasses} value={city} onChange={e => setCity(e.target.value)}>
                <option value="">All Michigan cities</option>
                {cities.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="relative block">
              <span className="sr-only">Choose a dance style</span>
              <Filter className="pointer-events-none absolute right-4 top-4 text-[#F46157]" size={18}/>
              <select className={selectClasses} value={style} onChange={e => setStyle(e.target.value)}>
                <option value="">All dance styles</option>
                {styles.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <button type="button" disabled={!hasFilters} onClick={() => {setCity("");setStyle("");}} className="inline-flex h-12 disabled:cursor-not-allowed disabled:opacity-60 items-center justify-center gap-2 rounded-full bg-[#F46157] px-6 text-sm font-extrabold text-[#160E18] hover:bg-[#FF8179] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <RotateCcw size={16}/> Clear filters
            </button>
          </div>
          <p role="status" aria-live="polite" className="mt-3 text-sm text-[#D8C8D6]">
            {upcomingCount} upcoming {upcomingCount === 1 ? "event" : "events"}{city ? " in " + city : ""}{style ? " · " + style : ""}
            {hasFilters && upcomingCount === 0 && " — try another city or style, or clear the filters."}
          </p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 lg:px-10" aria-label="Interactive dance calendar">
        <div className="overflow-hidden rounded-2xl border border-[#755572] bg-[#191421] shadow-[0_20px_80px_rgba(0,0,0,.3)]">
          {error ? <CalendarLoadError/> : <EventCalendarWrapper events={visibleEvents}/>}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#755572]/60 bg-[#1D1726] px-5 py-5">
          <p className="flex items-center gap-3 text-sm text-[#DBCAD7]"><CalendarDays size={19} className="text-[#F46157]"/> Looking for all event details, venues, and tickets?</p>
          <Link href="/events" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#F46157] px-4 text-sm font-bold text-[#FF8179] hover:bg-[#F46157]/15">
            See all events <ArrowRight size={16}/>
          </Link>
        </div>
      </section>
    </>
  );
}
