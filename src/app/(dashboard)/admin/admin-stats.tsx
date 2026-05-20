import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, Calendar, Music } from "lucide-react";

interface AdminStatsProps {
  totalOrganizers: number;
  pendingOrganizersCount: number;
  pendingEventsCount: number;
  totalDancers: number;
}

export function AdminStats({
  totalOrganizers,
  pendingOrganizersCount,
  pendingEventsCount,
  totalDancers,
}: AdminStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOrganizers}</p>
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
              <p className="text-2xl font-bold">{pendingOrganizersCount}</p>
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
              <p className="text-2xl font-bold">{pendingEventsCount}</p>
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
  );
}
