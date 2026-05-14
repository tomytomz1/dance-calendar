"use client";

import { useRouter } from "next/navigation";
import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CalendarLoadError() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 text-center min-h-[300px]">
      <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold mb-2">Unable to load events</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        The calendar could not connect to the database. This can happen if the
        database is temporarily unavailable or your connection was interrupted.
      </p>
      <Button onClick={() => router.refresh()} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}
