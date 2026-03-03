import type { Event, User, RecurrenceRule, EventInstance } from "@prisma/client";

export type EventWithOrganizer = Event & {
  organizer: Pick<User, "id" | "name" | "email" | "image">;
};

export type EventWithDetails = Event & {
  organizer: Pick<User, "id" | "name" | "email" | "image">;
  recurrenceRule: RecurrenceRule | null;
  instances: EventInstance[];
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  venue: string;
  city: string;
  danceStyles: string[];
  status: string;
  isRecurring: boolean;
  organizerName: string;
  /** Unique key for React when event is an expanded recurring instance */
  instanceKey?: string;
};

export const DANCE_STYLES = [
  "Salsa",
  "Bachata",
  "Kizomba",
  "Zouk",
  "Swing",
  "Lindy Hop",
  "West Coast Swing",
  "Ballroom",
  "Latin",
  "Tango",
  "Contemporary",
  "Hip Hop",
  "Breaking",
  "House",
  "Afrobeats",
  "Reggaeton",
  "Other",
] as const;

export type DanceStyle = (typeof DANCE_STYLES)[number];

export const EVENT_STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
} as const;

export const RECURRENCE_FREQUENCY_LABELS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 Weeks",
  MONTHLY: "Monthly",
} as const;
