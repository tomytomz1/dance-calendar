import Link from "next/link";
import { MapPin } from "lucide-react";
import { EventCountBanner } from "@/components/seo/event-count-banner";
import { HomeEmailSubscribe } from "@/components/home/home-email-subscribe";
import { cityPath } from "@/lib/seo";
import { cn } from "@/lib/utils";

export interface HomeHeroProps {
  eventCount: number;
  topCities: string[];
  cityCounts?: Record<string, number>;
}

export function HomeHero({
  eventCount,
  topCities,
  cityCounts = {},
}: HomeHeroProps) {
  return (
    <section className="border-b bg-gradient-to-b from-muted/40 to-background">
      <div className="container mx-auto px-4 py-5 max-w-3xl w-full">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
          Dance Events in Michigan
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Browse salsa, bachata, kizomba, swing, and ballroom socials.
        </p>

        <div className="mt-3">
          <EventCountBanner count={eventCount} />
        </div>

        {topCities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topCities.map((city) => (
              <Link
                key={city}
                href={cityPath(city)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium",
                  "min-h-[36px] text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <MapPin className="h-3 w-3 shrink-0" />
                {city}
                {cityCounts[city] != null && (
                  <span className="text-muted-foreground/80">
                    ({cityCounts[city]})
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        <HomeEmailSubscribe />
      </div>
    </section>
  );
}
