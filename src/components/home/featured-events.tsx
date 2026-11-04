import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { SeoEventRecord } from "@/lib/seo";
import { getListEventHref } from "@/lib/seo";
import { danceImageForStyles, organizerImageUrl } from "@/lib/dance-images";
import { formatInSiteTimeZone } from "@/lib/timezone";
import { EventCoverImage } from "@/components/events/event-cover-image";

interface FeaturedEventsProps {
  events: SeoEventRecord[];
}

export function FeaturedEvents({ events }: FeaturedEventsProps) {
  const featured = events.slice(0, 4);
  // Most socials list Salsa first; vary the illustrative art across the row.
  const usedArt = new Set<string>();
  const artFor = (styles: string[]) => {
    const image = danceImageForStyles(styles, usedArt);
    usedArt.add(image);
    return image;
  };

  return (
    <section className="relative mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-10" aria-labelledby="featured-title">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[.2em] text-[#F47C74]">The next great night out</span>
          <h2 id="featured-title" className="font-display mt-2 text-3xl font-extrabold tracking-tight text-[#FFF1E5] sm:text-4xl">
            On the dance floor <span className="text-[#F46157]">this month</span>
          </h2>
        </div>
        <Link href="/events" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#FF8179] hover:text-white">
          All upcoming events <ArrowRight size={17}/>
        </Link>
      </div>
      {featured.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-[#DBCCD8]">
          No upcoming events are listed yet. <Link href="/register" className="text-[#FF8179] underline underline-offset-4">Organizers can add the next dance night</Link>.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map(event => {
            return (
              <article key={event.instanceKey ?? (event.id + "-" + event.startTime.toISOString())} className="group overflow-hidden rounded-2xl border border-[#715264]/70 bg-[#1B1522] shadow-[0_20px_60px_rgba(0,0,0,.17)] transition-all hover:-translate-y-1 hover:border-[#F46157]">
                <Link href={getListEventHref(event)} className="block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#F46157]" aria-label={"View " + event.title}>
                  <div className="relative h-48 overflow-hidden bg-[#38273C]">
                    {/* The fallback art is illustrative, not a photo of this specific event. */}
                    <EventCoverImage
                      src={organizerImageUrl(event.imageUrl)}
                      fallbackSrc={artFor(event.danceStyles)}
                      alt={"Event image for " + event.title}
                      width={600}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 rounded-xl bg-[#F46157] px-3 py-2 text-center font-extrabold text-[#160E18] shadow-lg">
                      <span className="block text-[10px] uppercase leading-none tracking-wider">{formatInSiteTimeZone(event.startTime, "MMM")}</span>
                      <span className="block text-xl leading-tight">{formatInSiteTimeZone(event.startTime, "d")}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 min-h-[48px] text-lg font-bold leading-snug text-[#FFF1E5] group-hover:text-[#FF9A93]">{event.title}</h3>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[#CEBDCA]"><MapPin size={14} className="shrink-0 text-[#FF8179]"/>{event.city || "Michigan"} · {event.venue}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[#CEBDCA]"><CalendarDays size={13} className="shrink-0 text-[#FF8179]"/><time dateTime={event.startTime.toISOString()}>{formatInSiteTimeZone(event.startTime, "EEE, MMM d · h:mm a")}</time></p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {event.danceStyles.slice(0, 3).map((style, i) => <span key={style} className={i===0?"rounded-full bg-[#F46157] px-2.5 py-1 text-[11px] font-semibold text-[#160E18]":"rounded-full bg-[#704582] px-2.5 py-1 text-[11px] font-semibold text-white"}>{style}</span>)}
                      <ArrowRight size={18} className="ml-auto text-[#F46157]"/>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
