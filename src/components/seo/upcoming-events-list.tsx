import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { SeoEventRecord } from "@/lib/seo";
import { getListEventHref, cityPath, stylePath } from "@/lib/seo";
import { danceImageForStyles, organizerImageUrl } from "@/lib/dance-images";
import { formatInSiteTimeZone } from "@/lib/timezone";
import { EventCoverImage } from "@/components/events/event-cover-image";

interface UpcomingEventsListProps {
  events: SeoEventRecord[];
  heading?: string;
  showHubLinks?: boolean;
  listId?: string;
}

export function UpcomingEventsList({ events, heading = "Upcoming dance events", showHubLinks = false, listId = "upcoming-events" }: UpcomingEventsListProps) {
  return (
    <section aria-labelledby={listId} className="py-6 sm:py-8">
      <h2 id={listId} className="font-display mb-5 text-2xl font-extrabold tracking-tight text-[#FFF1E5]">{heading}</h2>
      {events.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-[#D7C5D2]">
          No upcoming events listed yet. Organizers can <Link className="text-[#FF8C83] underline underline-offset-4" href="/register">list an event</Link>.
        </div>
      ) : (
        <ul className="space-y-4">
          {events.map(event => {
            const href = getListEventHref(event);
            return (
              <li key={event.instanceKey ?? event.id + "-" + event.startTime.toISOString()}>
                <article className="group overflow-hidden rounded-2xl border border-[#675066] bg-[#1B1624] transition-all hover:border-[#F46157]/85 hover:bg-[#271C2D]">
                  <div className="grid grid-cols-[116px_minmax(0,1fr)] sm:grid-cols-[205px_minmax(0,1fr)]">
                    <Link href={href} className="relative block min-h-32 bg-[#34223B]" tabIndex={-1} aria-hidden="true">
                      <EventCoverImage
                        src={organizerImageUrl(event.imageUrl)}
                        fallbackSrc={danceImageForStyles(event.danceStyles)}
                        alt=""
                        width={410}
                        height={300}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        labelClassName="bottom-1 left-1 max-w-[95%] text-[9px]"
                      />
                    </Link>
                    <div className="min-w-0 p-3 sm:p-5">
                      <h3 className="text-base font-extrabold leading-snug text-[#FFF1E5] sm:text-xl">
                        <Link href={href} className="hover:text-[#FF8C83] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-[#FF8C83]">{event.title}</Link>
                      </h3>
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-[#D9C6D4] sm:text-sm"><CalendarDays className="mt-0.5 shrink-0 text-[#F46157]" size={15}/><time dateTime={event.startTime.toISOString()}>{formatInSiteTimeZone(event.startTime,"EEE, MMM d, yyyy 'at' h:mm a")}</time></p>
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-[#D9C6D4] sm:text-sm"><MapPin className="mt-0.5 shrink-0 text-[#F46157]" size={15}/>{event.venue}, {event.city}, Michigan</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {event.danceStyles.slice(0,4).map(style => <Link key={style} href={stylePath(style)} className="rounded-full bg-[#794788] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#F46157] hover:text-[#160E18]">{style}</Link>)}
                      </div>
                      {showHubLinks && <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#FF938C]">
                        <Link href={cityPath(event.city)} className="hover:underline">More in {event.city}</Link>
                        <Link href={href} className="inline-flex items-center gap-1 font-bold hover:underline">Details <ArrowRight size={14}/></Link>
                      </p>}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
