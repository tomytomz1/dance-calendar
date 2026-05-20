import Link from "next/link";
import { format } from "date-fns";
import type { SeoEventRecord } from "@/lib/seo";
import { getEventPath, cityPath, stylePath } from "@/lib/seo";
import { StyleBadge } from "@/components/events/style-badge";
import { cn } from "@/lib/utils";

interface UpcomingEventsListProps {
  events: SeoEventRecord[];
  heading?: string;
  showHubLinks?: boolean;
  listId?: string;
}

export function UpcomingEventsList({
  events,
  heading = "Upcoming dance events",
  showHubLinks = false,
  listId = "upcoming-events",
}: UpcomingEventsListProps) {
  if (events.length === 0) {
    return (
      <section aria-labelledby={listId} className="py-8">
        <h2 id={listId} className="text-xl font-semibold mb-4 font-display">
          {heading}
        </h2>
        <p className="text-muted-foreground">No upcoming events listed yet.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby={listId} className="py-6 sm:py-8">
      <h2 id={listId} className="text-xl font-semibold mb-4 font-display">
        {heading}
      </h2>
      <ul className="space-y-3">
        {events.map((event) => (
          <li
            key={
              event.instanceKey ??
              `${event.id}-${event.startTime.toISOString()}`
            }
          >
            <article
              className={cn(
                "rounded-lg border bg-background p-3 min-h-[44px]",
                "hover:bg-muted/50 transition-colors"
              )}
            >
              <h3 className="text-base font-medium">
                <Link
                  href={getEventPath(event)}
                  className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {event.title}
                </Link>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {format(event.startTime, "EEEE, MMMM d, yyyy 'at' h:mm a")} ·{" "}
                {event.venue}, {event.city}, Michigan
              </p>
              {event.danceStyles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {event.danceStyles.map((style) => (
                    <StyleBadge key={style} style={style} />
                  ))}
                </div>
              )}
              {showHubLinks && (
                <p className="text-sm mt-2 flex flex-wrap gap-3">
                  <Link
                    href={cityPath(event.city)}
                    className="text-primary hover:underline"
                  >
                    More in {event.city}
                  </Link>
                  {event.danceStyles.slice(0, 2).map((style) => (
                    <Link
                      key={style}
                      href={stylePath(style)}
                      className="text-primary hover:underline"
                    >
                      {style} events
                    </Link>
                  ))}
                </p>
              )}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
