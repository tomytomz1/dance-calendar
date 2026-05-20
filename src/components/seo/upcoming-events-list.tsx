import Link from "next/link";
import { format } from "date-fns";
import type { SeoEventRecord } from "@/lib/seo";
import { getEventPath, cityPath, stylePath } from "@/lib/seo";

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
        <h2 id={listId} className="text-xl font-semibold mb-4">
          {heading}
        </h2>
        <p className="text-muted-foreground">No upcoming events listed yet.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby={listId} className="py-8 border-t">
      <h2 id={listId} className="text-xl font-semibold mb-4">
        {heading}
      </h2>
      <ul className="space-y-6">
        {events.map((event) => (
          <li key={event.id} className="border-b pb-6 last:border-0">
            <h2 className="text-lg font-medium">
              <Link
                href={getEventPath(event)}
                className="text-primary hover:underline"
              >
                {event.title}
              </Link>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {format(event.startTime, "EEEE, MMMM d, yyyy 'at' h:mm a")} ·{" "}
              {event.venue}, {event.city}, Michigan
            </p>
            {event.danceStyles.length > 0 && (
              <p className="text-sm mt-1">
                {event.danceStyles.join(", ")}
              </p>
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
          </li>
        ))}
      </ul>
    </section>
  );
}
