"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminSectionNavProps {
  value: string;
  onValueChange: (value: string) => void;
  pendingCount: number;
  eventsCount: number;
  organizersCount: number;
  dancersCount: number;
}

export function AdminSectionNav({
  value,
  onValueChange,
  pendingCount,
  eventsCount,
  organizersCount,
  dancersCount,
}: AdminSectionNavProps) {
  const sections = [
    { value: "pending", label: `Pending events (${pendingCount})` },
    { value: "all-events", label: `All events (${eventsCount})` },
    { value: "organizers", label: `Organizers (${organizersCount})` },
    { value: "dancers", label: `Dancers (${dancersCount})` },
  ] as const;

  return (
    <>
      <div className="sm:hidden">
        <label htmlFor="admin-section" className="sr-only">
          Admin section
        </label>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger
            id="admin-section"
            className="h-11 w-full text-sm font-medium"
          >
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((section) => (
              <SelectItem key={section.value} value={section.value}>
                {section.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TabsList className="hidden h-10 w-full sm:grid sm:grid-cols-4">
        <TabsTrigger value="pending" className="text-sm">
          Pending ({pendingCount})
        </TabsTrigger>
        <TabsTrigger value="all-events" className="text-sm">
          Events ({eventsCount})
        </TabsTrigger>
        <TabsTrigger value="organizers" className="text-sm">
          Organizers ({organizersCount})
        </TabsTrigger>
        <TabsTrigger value="dancers" className="text-sm">
          Dancers ({dancersCount})
        </TabsTrigger>
      </TabsList>
    </>
  );
}
