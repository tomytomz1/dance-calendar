import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

export function HomeHeroCtas() {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-b bg-muted/30">
      <Button asChild size="sm" variant="default">
        <Link href="/events">
          <Calendar className="h-4 w-4 mr-1" />
          Browse all events
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href="/register">
          <Plus className="h-4 w-4 mr-1" />
          List your event
        </Link>
      </Button>
    </div>
  );
}
