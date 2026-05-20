import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, Calendar, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStatsProps {
  totalOrganizers: number;
  pendingOrganizersCount: number;
  pendingEventsCount: number;
  totalDancers: number;
}

const statItems = [
  {
    key: "organizers",
    label: "Organizers",
    mobileLabel: "Orgs",
    icon: Users,
    iconClass: "text-primary",
    bgClass: "bg-primary/10",
    getValue: (p: AdminStatsProps) => p.totalOrganizers,
  },
  {
    key: "pending-orgs",
    label: "Pending orgs",
    mobileLabel: "Pend org",
    icon: Clock,
    iconClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
    getValue: (p: AdminStatsProps) => p.pendingOrganizersCount,
  },
  {
    key: "pending-events",
    label: "Pending events",
    mobileLabel: "Pend evt",
    icon: Calendar,
    iconClass: "text-orange-500",
    bgClass: "bg-orange-500/10",
    getValue: (p: AdminStatsProps) => p.pendingEventsCount,
  },
  {
    key: "dancers",
    label: "Dancers",
    mobileLabel: "Dancers",
    icon: Music,
    iconClass: "text-green-500",
    bgClass: "bg-green-500/10",
    getValue: (p: AdminStatsProps) => p.totalDancers,
  },
] as const;

export function AdminStats(props: AdminStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 sm:gap-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        const value = item.getValue(props);
        return (
          <Card key={item.key} className="py-0 shadow-none sm:shadow-sm">
            <CardContent className="flex flex-col items-center gap-1 p-2.5 text-center sm:flex-row sm:items-center sm:gap-4 sm:p-6 sm:text-left">
              <div
                className={cn(
                  "rounded-full p-2 sm:p-3",
                  item.bgClass
                )}
              >
                <Icon className={cn("h-4 w-4 sm:h-6 sm:w-6", item.iconClass)} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold tabular-nums leading-none sm:text-2xl">
                  {value}
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground sm:mt-0 sm:text-sm">
                  <span className="sm:hidden">{item.mobileLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
