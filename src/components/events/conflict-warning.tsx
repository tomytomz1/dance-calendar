"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, AlertCircle, ChevronRight } from "lucide-react";
import type { ConflictingEvent } from "@/lib/conflicts";

interface ConflictWarningProps {
  startTime: Date | null;
  endTime: Date | null;
  city: string;
  venue: string;
  excludeEventId?: string;
  onConflictsChange?: (hasConflicts: boolean) => void;
}

interface ConflictResult {
  hasConflicts: boolean;
  conflicts: ConflictingEvent[];
  conflictType: "time" | "venue" | "city" | null;
  severity: "high" | "medium" | "low" | null;
  message: string;
}

export function ConflictWarning({
  startTime,
  endTime,
  city,
  venue,
  excludeEventId,
  onConflictsChange,
}: ConflictWarningProps) {
  const [result, setResult] = useState<ConflictResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const checkConflicts = useCallback(async () => {
    if (!startTime || !endTime) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/events/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          city,
          venue: venue || undefined,
          excludeEventId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error("Error checking conflicts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startTime, endTime, city, venue, excludeEventId]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      checkConflicts();
    }, 200);

    return () => clearTimeout(debounce);
  }, [checkConflicts]);

  useEffect(() => {
    onConflictsChange?.(result?.hasConflicts ?? false);
  }, [result?.hasConflicts, onConflictsChange]);

  if (isLoading || !result || !result.hasConflicts) {
    return null;
  }

  const getIcon = () => {
    switch (result.severity) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = (): "default" | "destructive" => {
    return result.severity === "high" ? "destructive" : "default";
  };

  return (
    <Alert variant={getVariant()}>
      {getIcon()}
      <AlertTitle>
        {result.severity === "high"
          ? "Scheduling Conflict"
          : result.severity === "medium"
          ? "Potential Overlap"
          : "Nearby Events"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">{result.message}</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              View {result.conflicts.length} conflicting event
              {result.conflicts.length > 1 ? "s" : ""}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Conflicting Events</DialogTitle>
              <DialogDescription>
                These events may overlap with your scheduled time
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {result.conflicts.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border bg-card space-y-2"
                >
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.startTime), "PPP")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.startTime), "p")} -{" "}
                    {format(new Date(event.endTime), "p")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.venue}, {event.city}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {event.danceStyles.slice(0, 3).map((style) => (
                      <Badge key={style} variant="outline" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By {event.organizerName}
                  </p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </AlertDescription>
    </Alert>
  );
}
