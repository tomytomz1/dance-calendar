import { z } from "zod";
import { optionalEmptyOrHttpUrl } from "@/lib/zod-url";

export const eventInstant = z.string().datetime({ offset: true }).transform((value) => new Date(value));
export const recurrenceSchema = z.object({
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]),
  interval: z.number().int().min(1).max(365).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  until: eventInstant.optional(),
  count: z.number().int().min(1).max(1000).optional(),
  monthlyPattern: z.enum(["BY_DATE", "BY_WEEKDAY"]).optional(),
  monthlyDayOfWeek: z.number().int().min(0).max(6).optional(),
  monthlyWeeks: z.array(z.union([z.literal(-1), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])).max(6).optional(),
}).superRefine((rule, ctx) => {
  if (rule.frequency === "MONTHLY" && rule.monthlyPattern === "BY_WEEKDAY" &&
      (rule.monthlyDayOfWeek === undefined || !rule.monthlyWeeks?.length)) {
    ctx.addIssue({ code: "custom", message: "Choose a weekday and at least one monthly week." });
  }
});
const fields = {
  title: z.string().trim().min(3).max(300), description: z.string().max(20000).optional(),
  danceStyles: z.array(z.string().trim().min(1).max(60)).min(1).max(30),
  venue: z.string().trim().min(2).max(300), address: z.string().trim().min(5).max(500), city: z.string().trim().min(2).max(150),
  latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(),
  startTime: eventInstant, endTime: eventInstant,
  imageUrl: optionalEmptyOrHttpUrl, ticketUrl: optionalEmptyOrHttpUrl, price: z.string().max(300).optional(),
  isRecurring: z.boolean(), recurrence: recurrenceSchema.optional(),
};
export const createEventSchema = z.object({ ...fields, isRecurring: fields.isRecurring.default(false) }).superRefine((data, ctx) => {
  if (data.endTime <= data.startTime) ctx.addIssue({ code: "custom", path: ["endTime"], message: "End must be after the start." });
  if (data.isRecurring && !data.recurrence) ctx.addIssue({ code: "custom", path: ["recurrence"], message: "A recurring event requires a recurrence rule." });
});
export const updateEventSchema = z.object(fields).partial().extend({
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "CANCELLED"]).optional(),
});
