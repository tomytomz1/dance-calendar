import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import { cityPath, stylePath } from "@/lib/seo";

export interface HomeHeroProps {
  eventCount: number;
  topCities: string[];
  cityCounts?: Record<string, number>;
}

const danceStyles = ["Salsa", "Bachata", "Kizomba", "Swing", "Ballroom"];

export function HomeHero({ eventCount, topCities, cityCounts = {} }: HomeHeroProps) {
  return (
    <section className="mdl-hero relative isolate overflow-hidden border-b border-white/10">
      <div className="mdl-hero-image absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mdl-hero-shade absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mx-auto flex min-h-[540px] w-full max-w-7xl flex-col justify-center px-5 pb-20 pt-16 sm:px-8 md:min-h-[590px] md:pb-24 lg:px-10">
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#F7EFE5] backdrop-blur">
            <Sparkles size={15} className="text-[#FF796E]" />
            Michigan&apos;s social dance community
          </p>
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] text-[#FFF4E8] sm:text-6xl md:text-7xl lg:text-[82px]">
            Find your rhythm.<br />
            <span className="relative inline-block">Find your people.
              <span className="absolute -bottom-2 left-1/4 h-[5px] w-1/2 rounded-full bg-[#F46157] -rotate-2" aria-hidden="true" />
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-[#FFF2E8] md:text-xl">
            Michigan&apos;s home for dance nights, socials &amp; classes.
            Discover your next great night out.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/calendar" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#F46157] px-7 text-base font-bold text-[#160E18] shadow-[0_12px_35px_rgba(244,97,87,.22)] transition-transform hover:-translate-y-0.5 hover:bg-[#FF786E] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <CalendarDays size={19} /> Explore the calendar <ArrowRight size={18} />
            </Link>
            <Link href="/events" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 bg-black/30 px-6 text-sm font-semibold text-[#FFF4E8] backdrop-blur hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              {eventCount > 0 ? eventCount + " events coming up" : "Browse upcoming events"} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {danceStyles.map(style => (
              <Link key={style} href={stylePath(style)} className="inline-flex min-h-9 items-center rounded-full border border-[#DE9ACB]/70 bg-[#16101C]/55 px-4 py-1.5 text-xs font-semibold text-[#FFF4EA] transition-colors hover:border-[#F46157] hover:bg-[#F46157]/20">
                {style}
              </Link>
            ))}
          </div>
        </div>
        {topCities.length > 0 && (
          <div className="mt-10 flex max-w-3xl flex-wrap items-center gap-2 text-sm">
            <span className="mr-1 inline-flex items-center gap-1 text-[#FFF4E8]/80"><MapPin size={15}/> Popular cities:</span>
            {topCities.slice(0, 4).map(city => (
              <Link key={city} href={cityPath(city)} className="text-[#FFF4EA] underline decoration-[#F46157] underline-offset-4 hover:text-[#FF9389]">
                {city}{cityCounts[city] ? " (" + cityCounts[city] + ")" : ""}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute -bottom-px inset-x-0 h-20 bg-gradient-to-b from-transparent to-[#0D101B]" />
    </section>
  );
}
