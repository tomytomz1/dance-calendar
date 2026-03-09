"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Check, X, Calendar, Users, Clock, Trash2, Music } from "lucide-react";
import { DeleteEventDialog } from "@/components/events/delete-event-dialog";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";

interface Organizer {
  id: string;
  email: string;
  name: string | null;
  verified: boolean;
  createdAt: string;
  _count: { events: number };
}

interface AdminEvent {
  id: string;
  title: string;
  status: string;
  venue: string;
  city: string;
  startTime: string;
  danceStyles: string[];
  createdAt: string;
  isRecurring?: boolean;
  recurrenceRule?: {
    frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    monthlyPattern?: "BY_DATE" | "BY_WEEKDAY" | null;
    monthlyDayOfWeek?: number | null;
    monthlyWeeks?: number[];
  } | null;
  organizer: {
    id: string;
    name: string | null;
  };
}

interface Dancer {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  APPROVED: "default",
  PENDING_APPROVAL: "outline",
  CANCELLED: "destructive",
  DRAFT: "secondary",
};

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Approved",
  PENDING_APPROVAL: "Pending",
  CANCELLED: "Cancelled",
  DRAFT: "Draft",
};

function getRecurrenceLabel(event: AdminEvent): string | null {
  if (!event.isRecurring || !event.recurrenceRule) return null;

  const { frequency, monthlyPattern, monthlyDayOfWeek, monthlyWeeks } =
    event.recurrenceRule;

  if (
    frequency === "MONTHLY" &&
    monthlyPattern === "BY_WEEKDAY" &&
    monthlyDayOfWeek != null &&
    monthlyWeeks &&
    monthlyWeeks.length > 0
  ) {
    const weekdayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const weekLabels: Record<number, string> = {
      1: "1st",
      2: "2nd",
      3: "3rd",
      4: "4th",
      [-1]: "last",
    };

    const parts = [...monthlyWeeks]
      .map((w) => weekLabels[w] ?? `${w}th`)
      .sort((a, b) => a.localeCompare(b));

    const weekPart = parts.join(" & ");

    return `Every ${weekPart} ${weekdayNames[monthlyDayOfWeek]} of the month`;
  }

  if (frequency === "MONTHLY") {
    const day = new Date(event.startTime).getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";
    return `Every month on the ${day}${suffix}`;
  }

  return null;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [dancers, setDancers] = useState<Dancer[]>([]);
  const [totalDancers, setTotalDancers] = useState(0);
  const [pendingEvents, setPendingEvents] = useState<AdminEvent[]>([]);
  const [allEvents, setAllEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null);
  const [deleteOrgTarget, setDeleteOrgTarget] = useState<Organizer | null>(null);
  const [deleteDancerTarget, setDeleteDancerTarget] = useState<Dancer | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      redirect("/");
    }

    fetchData();
  }, [session, status]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [usersRes, pendingRes, allEventsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/events/pending"),
        fetch("/api/admin/events"),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setOrganizers(data.organizers);
        setTotalDancers(data.totalDancers ?? 0);
        setDancers(data.dancers ?? []);
      }

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingEvents(data);
      }

      if (allEventsRes.ok) {
        const data = await allEventsRes.json();
            setAllEvents(
              data.map((e: any) => ({
                ...e,
                startTime: e.startTime,
                createdAt: e.createdAt,
              }))
            );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApproveOrganizer(id: string) {
    try {
      const response = await fetch(`/api/admin/users/${id}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Organizer approved successfully");
        setOrganizers((prev) =>
          prev.map((o) => (o.id === id ? { ...o, verified: true } : o))
        );
      } else {
        toast.error("Failed to approve organizer");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleRejectOrganizer(id: string) {
    try {
      const response = await fetch(`/api/admin/users/${id}/approve`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Organizer verification revoked");
        setOrganizers((prev) =>
          prev.map((o) => (o.id === id ? { ...o, verified: false } : o))
        );
      } else {
        toast.error("Failed to revoke verification");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleApproveEvent(id: string) {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (response.ok) {
        toast.success("Event approved successfully");
        setPendingEvents((prev) => prev.filter((e) => e.id !== id));
        setAllEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "APPROVED" } : e))
        );
      } else {
        toast.error("Failed to approve event");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleRejectEvent(id: string) {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (response.ok) {
        toast.success("Event rejected");
        setPendingEvents((prev) => prev.filter((e) => e.id !== id));
        setAllEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "CANCELLED" } : e))
        );
      } else {
        toast.error("Failed to reject event");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const pendingOrganizers = organizers.filter((o) => !o.verified);
  const verifiedOrganizers = organizers.filter((o) => o.verified);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage organizers and approve events
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{organizers.length}</p>
                <p className="text-sm text-muted-foreground">Total Organizers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingOrganizers.length}</p>
                <p className="text-sm text-muted-foreground">Pending Organizers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingEvents.length}</p>
                <p className="text-sm text-muted-foreground">Pending Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Music className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDancers}</p>
                <p className="text-sm text-muted-foreground">Total Dancers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending Events ({pendingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="all-events">
            All Events ({allEvents.length})
          </TabsTrigger>
          <TabsTrigger value="organizers">
            Organizers ({organizers.length})
          </TabsTrigger>
          <TabsTrigger value="dancers">
            Dancers ({dancers.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Events - Approve / Reject only */}
        <TabsContent value="pending" className="space-y-4">
          {pendingEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending events</p>
              </CardContent>
            </Card>
          ) : (
            pendingEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <p>
                      {format(new Date(event.startTime), "PPP 'at' p")}
                    </p>
                    <p>{event.venue}, {event.city}</p>
                    <p>By: {event.organizer.name}</p>
                    {getRecurrenceLabel(event) && (
                      <p className="text-xs">
                        Recurs: {getRecurrenceLabel(event)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.danceStyles.map((style) => (
                      <Badge key={style} variant="outline" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveEvent(event.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectEvent(event.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* All Events - status badge + Delete for non-pending */}
        <TabsContent value="all-events" className="space-y-4">
          {allEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No events found</p>
              </CardContent>
            </Card>
          ) : (
            allEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge variant={STATUS_VARIANT[event.status] || "outline"}>
                      {STATUS_LABEL[event.status] || event.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <p>
                      {format(new Date(event.startTime), "PPP 'at' p")}
                    </p>
                    <p>{event.venue}, {event.city}</p>
                    <p>By: {event.organizer.name}</p>
                    {getRecurrenceLabel(event) && (
                      <p className="text-xs">
                        Recurs: {getRecurrenceLabel(event)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.danceStyles.map((style) => (
                      <Badge key={style} variant="outline" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/organizer/events/${event.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    {event.status !== "PENDING_APPROVAL" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget(event)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="organizers" className="space-y-4">
          {pendingOrganizers.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Pending Approval</h3>
              {pendingOrganizers.map((organizer) => (
                <Card key={organizer.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {organizer.name?.charAt(0).toUpperCase() || "O"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{organizer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {organizer.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {format(new Date(organizer.createdAt), "PP")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveOrganizer(organizer.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectOrganizer(organizer.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteOrgTarget(organizer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {verifiedOrganizers.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Verified Organizers</h3>
              {verifiedOrganizers.map((organizer) => (
                <Card key={organizer.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {organizer.name?.charAt(0).toUpperCase() || "O"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{organizer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {organizer.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {organizer._count.events} events
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>Verified</Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteOrgTarget(organizer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dancers" className="space-y-4">
          {dancers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No dancers yet</p>
              </CardContent>
            </Card>
          ) : (
            dancers.map((dancer) => (
              <Card key={dancer.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {dancer.name?.charAt(0).toUpperCase() || "D"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{dancer.name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">
                          {dancer.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {format(new Date(dancer.createdAt), "PP")}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDancerTarget(dancer)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {deleteTarget && (
        <DeleteEventDialog
          eventId={deleteTarget.id}
          eventTitle={deleteTarget.title}
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setAllEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
            setDeleteTarget(null);
          }}
        />
      )}

      {deleteOrgTarget && (
        <DeleteUserDialog
          userId={deleteOrgTarget.id}
          userName={deleteOrgTarget.name || deleteOrgTarget.email}
          isOpen={!!deleteOrgTarget}
          onClose={() => setDeleteOrgTarget(null)}
          onDeleted={() => {
            setOrganizers((prev) => prev.filter((o) => o.id !== deleteOrgTarget.id));
            setAllEvents((prev) => prev.filter((e) => e.organizer.id !== deleteOrgTarget.id));
            setDeleteOrgTarget(null);
          }}
        />
      )}

      {deleteDancerTarget && (
        <DeleteUserDialog
          userId={deleteDancerTarget.id}
          userName={deleteDancerTarget.name || deleteDancerTarget.email}
          isOpen={!!deleteDancerTarget}
          onClose={() => setDeleteDancerTarget(null)}
          onDeleted={() => {
            setDancers((prev) => prev.filter((d) => d.id !== deleteDancerTarget.id));
            setTotalDancers((prev) => Math.max(0, prev - 1));
            setDeleteDancerTarget(null);
          }}
          label="Dancer"
        />
      )}
    </div>
  );
}
