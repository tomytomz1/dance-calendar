"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addHours } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DANCE_STYLES, RECURRENCE_FREQUENCY_LABELS } from "@/lib/types";
import { ConflictWarning } from "./conflict-warning";
import type { Event, RecurrenceRule } from "@prisma/client";

const eventFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  danceStyles: z.array(z.string()).min(1, "Select at least one dance style"),
  venue: z.string().min(2, "Venue is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  startDate: z.date({ message: "Start date is required" }),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.date({ message: "End date is required" }),
  endTime: z.string().min(1, "End time is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  ticketUrl: z.string().url().optional().or(z.literal("")),
  price: z.string().optional(),
  isRecurring: z.boolean(),
  recurrenceFrequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
  recurrenceUntil: z.date().optional(),
  monthlyPattern: z.enum(["BY_DATE", "BY_WEEKDAY"]).optional(),
  monthlyDayOfWeek: z.number().int().min(0).max(6).optional(),
  monthlyWeeks: z.array(z.number()).optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTE_OPTIONS = ["00", "15", "30", "45"];
const PERIOD_OPTIONS = ["AM", "PM"] as const;

function parseTimeTo12Hour(hhmm: string): {
  hour: number;
  minute: string;
  period: "AM" | "PM";
} {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  const h24 = h ?? 0;
  const min = m ?? 0;
  const minute = ["00", "15", "30", "45"][Math.round(min / 15) % 4] ?? "00";
  if (h24 === 0)
    return { hour: 12, minute, period: "AM" };
  if (h24 === 12)
    return { hour: 12, minute, period: "PM" };
  if (h24 < 12)
    return { hour: h24, minute, period: "AM" };
  return { hour: h24 - 12, minute, period: "PM" };
}

function toHHmm(hour: number, minute: string, period: "AM" | "PM"): string {
  let h24: number;
  if (period === "AM") {
    h24 = hour === 12 ? 0 : hour;
  } else {
    h24 = hour === 12 ? 12 : hour + 12;
  }
  return `${h24.toString().padStart(2, "0")}:${minute}`;
}

interface EventFormProps {
  event?: Event & { recurrenceRule?: RecurrenceRule | null };
  mode: "create" | "edit";
}

export function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] =
    useState<EventFormValues | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [recurrenceUntilOpen, setRecurrenceUntilOpen] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    event?.danceStyles || []
  );

  const defaultValues: Partial<EventFormValues> = event
    ? {
        title: event.title,
        description: event.description || "",
        danceStyles: event.danceStyles,
        venue: event.venue,
        address: event.address,
        city: event.city,
        startDate: new Date(event.startTime),
        startTime: format(new Date(event.startTime), "HH:mm"),
        endDate: new Date(event.endTime),
        endTime: format(new Date(event.endTime), "HH:mm"),
        imageUrl: event.imageUrl || "",
        ticketUrl: event.ticketUrl || "",
        price: event.price || "",
        isRecurring: event.isRecurring,
        recurrenceFrequency: event.recurrenceRule?.frequency,
        recurrenceUntil: event.recurrenceRule?.until
          ? new Date(event.recurrenceRule.until)
          : undefined,
        monthlyPattern: event.recurrenceRule?.monthlyPattern ?? "BY_DATE",
        monthlyDayOfWeek: event.recurrenceRule?.monthlyDayOfWeek ?? undefined,
        monthlyWeeks:
          event.recurrenceRule?.monthlyWeeks &&
          event.recurrenceRule.monthlyWeeks.length > 0
            ? event.recurrenceRule.monthlyWeeks
            : undefined,
      }
    : {
        title: "",
        description: "",
        danceStyles: [],
        venue: "",
        address: "",
        city: "",
        startTime: "",
        endTime: "",
        imageUrl: "",
        ticketUrl: "",
        price: "",
        isRecurring: false,
      };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  });

  const isRecurring = form.watch("isRecurring");
  const recurrenceFrequency = form.watch("recurrenceFrequency");
  const monthlyPattern = form.watch("monthlyPattern");
  const watchedStartDate = form.watch("startDate");
  const watchedStartTime = form.watch("startTime");
  const watchedEndDate = form.watch("endDate");
  const watchedEndTime = form.watch("endTime");
  const watchedCity = form.watch("city");
  const watchedVenue = form.watch("venue");

  const getDateTime = (date: Date | undefined, time: string | undefined): Date | null => {
    if (!date || !time?.trim()) return null;
    const dateTime = new Date(date);
    const [hours, minutes] = (time || "00:00").split(":").map(Number);
    dateTime.setHours(hours ?? 0, minutes ?? 0);
    return dateTime;
  };

  const startDateTime = getDateTime(watchedStartDate, watchedStartTime);
  const endDateTimeRaw = getDateTime(watchedEndDate, watchedEndTime);
  const endDateTime =
    endDateTimeRaw ??
    (startDateTime ? addHours(startDateTime, 1) : null);

  function handleSubmit(data: EventFormValues) {
    if (hasConflicts) {
      setPendingSubmitData(data);
      setConfirmDialogOpen(true);
      return;
    }
    onSubmit(data);
  }

  function handleConfirmContinue() {
    if (pendingSubmitData) {
      onSubmit(pendingSubmitData);
      setPendingSubmitData(null);
    }
    setConfirmDialogOpen(false);
  }

  async function onSubmit(data: EventFormValues) {
    setIsSubmitting(true);

    const startDateTime = new Date(data.startDate);
    const [startHours, startMinutes] = data.startTime.split(":").map(Number);
    startDateTime.setHours(startHours, startMinutes);

    const endDateTime = new Date(data.endDate);
    const [endHours, endMinutes] = data.endTime.split(":").map(Number);
    endDateTime.setHours(endHours, endMinutes);

    const hasExistingRecurrence = !!event?.recurrenceRule;
    const effectiveRecurrenceFrequency =
      data.recurrenceFrequency ?? event?.recurrenceRule?.frequency;
    const shouldSendRecurrence =
      (data.isRecurring || hasExistingRecurrence) &&
      !!effectiveRecurrenceFrequency;

    const payload = {
      title: data.title,
      description: data.description,
      danceStyles: data.danceStyles,
      venue: data.venue,
      address: data.address,
      city: data.city,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      imageUrl: data.imageUrl || undefined,
      ticketUrl: data.ticketUrl || undefined,
      price: data.price,
      isRecurring: data.isRecurring,
      ...(shouldSendRecurrence &&
        effectiveRecurrenceFrequency && {
          recurrence: {
            frequency: effectiveRecurrenceFrequency,
            interval: 1,
            until: data.recurrenceUntil?.toISOString(),
            ...(effectiveRecurrenceFrequency === "MONTHLY" && {
              monthlyPattern:
                data.monthlyPattern ??
                event?.recurrenceRule?.monthlyPattern ??
                "BY_DATE",
              monthlyDayOfWeek:
                data.monthlyDayOfWeek ??
                event?.recurrenceRule?.monthlyDayOfWeek ??
                undefined,
              monthlyWeeks:
                data.monthlyWeeks ??
                event?.recurrenceRule?.monthlyWeeks ??
                undefined,
            }),
          },
        }),
    };

    try {
      const url = mode === "create" ? "/api/events" : `/api/events/${event?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Something went wrong");
        return;
      }

      toast.success(
        mode === "create"
          ? "Event created! It will be visible after admin approval."
          : "Event updated successfully!"
      );
      router.push("/organizer/events");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const toggleStyle = (style: string) => {
    const current = form.getValues("danceStyles");
    const updated = current.includes(style)
      ? current.filter((s) => s !== style)
      : [...current, style];
    form.setValue("danceStyles", updated);
    setSelectedStyles(updated);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Saturday Night Salsa Social"
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell people about your event..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="danceStyles"
              render={() => (
                <FormItem>
                  <FormLabel>Dance Styles</FormLabel>
                  <FormDescription>
                    Select all dance styles featured at this event
                  </FormDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DANCE_STYLES.map((style) => (
                      <Badge
                        key={style}
                        variant={
                          selectedStyles.includes(style) ? "default" : "outline"
                        }
                        className="cursor-pointer text-sm py-1.5 px-3"
                        onClick={() => toggleStyle(style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConflictWarning
              startTime={startDateTime}
              endTime={endDateTime}
              city={watchedCity?.trim() || ""}
              venue={watchedVenue || ""}
              excludeEventId={event?.id}
              onConflictsChange={setHasConflicts}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-12 pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            if (date) setStartDateOpen(false);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => {
                  const { hour, minute, period } = parseTimeTo12Hour(
                    field.value || "00:00"
                  );
                  return (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          value={String(hour)}
                          onValueChange={(v) =>
                            field.onChange(
                              toHHmm(Number(v), minute, period)
                            )
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 flex-1">
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HOUR_OPTIONS.map((h) => (
                              <SelectItem key={h} value={String(h)}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={minute}
                          onValueChange={(v) =>
                            field.onChange(toHHmm(hour, v, period))
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 flex-1">
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MINUTE_OPTIONS.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={period}
                          onValueChange={(v: "AM" | "PM") =>
                            field.onChange(toHHmm(hour, minute, v))
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 w-24">
                              <SelectValue placeholder="AM/PM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PERIOD_OPTIONS.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-12 pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            if (date) setEndDateOpen(false);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => {
                  const { hour, minute, period } = parseTimeTo12Hour(
                    field.value || "00:00"
                  );
                  return (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          value={String(hour)}
                          onValueChange={(v) =>
                            field.onChange(
                              toHHmm(Number(v), minute, period)
                            )
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 flex-1">
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HOUR_OPTIONS.map((h) => (
                              <SelectItem key={h} value={String(h)}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={minute}
                          onValueChange={(v) =>
                            field.onChange(toHHmm(hour, v, period))
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 flex-1">
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MINUTE_OPTIONS.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={period}
                          onValueChange={(v: "AM" | "PM") =>
                            field.onChange(toHHmm(hour, minute, v))
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 w-24">
                              <SelectValue placeholder="AM/PM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PERIOD_OPTIONS.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <Separator />

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Recurring Event</FormLabel>
                    <FormDescription>
                      This event repeats on a regular schedule
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Button
                      type="button"
                      variant={field.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(!field.value)}
                    >
                      {field.value ? "Yes" : "No"}
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />

            {isRecurring && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recurrenceFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(RECURRENCE_FREQUENCY_LABELS).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurrenceUntil"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Repeat Until</FormLabel>
                        <FormDescription>
                          Leave empty to repeat indefinitely with no end date.
                        </FormDescription>
                        <Popover
                          open={recurrenceUntilOpen}
                          onOpenChange={setRecurrenceUntilOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-12 pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>No end date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                if (!date) return;
                                field.onChange(date);
                                setRecurrenceUntilOpen(false);
                              }}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {field.value && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="mt-1 px-0 h-auto text-xs text-muted-foreground self-start"
                            onClick={() => {
                              form.setValue("recurrenceUntil", undefined, {
                                shouldDirty: true,
                                shouldTouch: true,
                              });
                              field.onChange(undefined);
                              setRecurrenceUntilOpen(false);
                            }}
                          >
                            Clear end date (no end date)
                          </Button>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {recurrenceFrequency === "MONTHLY" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-lg p-4 bg-background">
                    <FormField
                      control={form.control}
                      name="monthlyPattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Pattern</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || "BY_DATE"}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BY_DATE">
                                Same date every month
                              </SelectItem>
                              <SelectItem value="BY_WEEKDAY">
                                On specific weekdays (e.g. last Sunday)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose whether this repeats by calendar date or by
                            weekday pattern.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {monthlyPattern === "BY_WEEKDAY" && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="monthlyDayOfWeek"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Day of Week</FormLabel>
                              <Select
                                onValueChange={(val) =>
                                  field.onChange(Number(val))
                                }
                                defaultValue={
                                  field.value !== undefined
                                    ? String(field.value)
                                    : undefined
                                }
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select day" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">Sunday</SelectItem>
                                  <SelectItem value="1">Monday</SelectItem>
                                  <SelectItem value="2">Tuesday</SelectItem>
                                  <SelectItem value="3">Wednesday</SelectItem>
                                  <SelectItem value="4">Thursday</SelectItem>
                                  <SelectItem value="5">Friday</SelectItem>
                                  <SelectItem value="6">Saturday</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="monthlyWeeks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weeks in Month</FormLabel>
                              <FormDescription>
                                Select one or more weeks (e.g. 1st and 3rd
                                Saturday).
                              </FormDescription>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {[
                                  { label: "1st", value: 1 },
                                  { label: "2nd", value: 2 },
                                  { label: "3rd", value: 3 },
                                  { label: "4th", value: 4 },
                                  { label: "Last", value: -1 },
                                ].map((option) => {
                                  const selected =
                                    field.value?.includes(option.value) ??
                                    false;
                                  return (
                                    <Badge
                                      key={option.value}
                                      variant={
                                        selected ? "default" : "outline"
                                      }
                                      className="cursor-pointer px-3 py-1 text-sm"
                                      onClick={() => {
                                        const current = field.value || [];
                                        const next = selected
                                          ? current.filter(
                                              (v) => v !== option.value
                                            )
                                          : [...current, option.value];
                                        field.onChange(next);
                                      }}
                                    >
                                      {option.label}
                                    </Badge>
                                  );
                                })}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Dance Studio XYZ"
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 Main Street"
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} className="h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="$20 or Free"
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <FormDescription>
                    Leave empty if free or price varies
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ticketUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <FormDescription>
                    Link to purchase tickets (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <FormDescription>
                    Link to event flyer or image (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1 h-12" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : mode === "create"
              ? "Create Event"
              : "Update Event"}
          </Button>
        </div>
      </form>

      <Dialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          setConfirmDialogOpen(open);
          if (!open) setPendingSubmitData(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Scheduling Conflict</DialogTitle>
            <DialogDescription>
              There is already an event at this time and date. Do you want to
              continue setting up your event anyway?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setPendingSubmitData(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmContinue}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
