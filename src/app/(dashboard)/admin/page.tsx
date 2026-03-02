"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Check, X, Calendar, Users, Clock } from "lucide-react";

interface PendingOrganizer {
  id: string;
  email: string;
  name: string | null;
  verified: boolean;
  createdAt: string;
  _count: { events: number };
}

interface PendingEvent {
  id: string;
  title: string;
  venue: string;
  city: string;
  startTime: string;
  danceStyles: string[];
  organizer: {
    id: string;
    name: string | null;
  };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [organizers, setOrganizers] = useState<PendingOrganizer[]>([]);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const [organizersRes, eventsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/events/pending"),
      ]);

      if (organizersRes.ok) {
        const data = await organizersRes.json();
        setOrganizers(data);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setPendingEvents(data);
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/10">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingEvents.length}</p>
                <p className="text-sm text-muted-foreground">Pending Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">
            Pending Events ({pendingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="organizers">
            Organizers ({organizers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
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
                      variant="destructive"
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
                          variant="destructive"
                          onClick={() => handleRejectOrganizer(organizer.id)}
                        >
                          <X className="h-4 w-4" />
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
                      <Badge>Verified</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
