import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInstancesForEvent } from "@/lib/recurrence";
import { generateUniqueEventSlug } from "@/lib/slug";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const recurrenceSchema = z.object({
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]),
  interval: z.number().min(1).default(1),
  daysOfWeek: z.array(z.number()).optional(),
  until: z.string().transform((val) => new Date(val)).optional(),
  count: z.number().optional(),
  monthlyPattern: z.enum(["BY_DATE", "BY_WEEKDAY"]).optional(),
  monthlyDayOfWeek: z.number().int().min(0).max(6).optional(),
  monthlyWeeks: z.array(z.number()).optional(),
});

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  danceStyles: z.array(z.string()).min(1, "Select at least one dance style"),
  venue: z.string().min(2, "Venue is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
  imageUrl: z.string().url().optional().or(z.literal("")),
  ticketUrl: z.string().url().optional().or(z.literal("")),
  price: z.string().optional(),
  isRecurring: z.boolean().optional().default(false),
  recurrence: recurrenceSchema.optional(),
});

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const key = `events:get:${ip}`;
    const result = checkRateLimit({
      key,
      limit: 60,
      windowMs: 60 * 1000, // 60 req/min per IP
    });

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (result.resetAt - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const style = searchParams.get("style");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Prisma.EventWhereInput = {
      status: "APPROVED",
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(style ? { danceStyles: { has: style } } : {}),
    };

    if (from && to) {
      where.AND = [
        { startTime: { lte: new Date(to) } },
        { endTime: { gte: new Date(from) } },
      ];
    } else if (from) {
      where.startTime = { gte: new Date(from) };
    } else if (to) {
      where.endTime = { lte: new Date(to) };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only organizers can create events" },
        { status: 403 }
      );
    }

    if (!session.user.verified && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Your organizer account is pending approval" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = eventSchema.parse(body);

    if (validatedData.endTime <= validatedData.startTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const slug = await generateUniqueEventSlug(validatedData.title);

    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        slug,
        description: validatedData.description,
        danceStyles: validatedData.danceStyles,
        venue: validatedData.venue,
        address: validatedData.address,
        city: validatedData.city,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        imageUrl: validatedData.imageUrl || null,
        ticketUrl: validatedData.ticketUrl || null,
        price: validatedData.price,
        isRecurring: validatedData.isRecurring,
        status: session.user.role === "ADMIN" ? "APPROVED" : "PENDING_APPROVAL",
        organizerId: session.user.id,
        ...(validatedData.isRecurring &&
          validatedData.recurrence && {
            recurrenceRule: {
              create: {
                frequency: validatedData.recurrence.frequency,
                interval: validatedData.recurrence.interval,
                daysOfWeek: validatedData.recurrence.daysOfWeek || [],
                until: validatedData.recurrence.until ?? null,
                count: validatedData.recurrence.count,
                monthlyPattern:
                  validatedData.recurrence.monthlyPattern ?? "BY_DATE",
                monthlyDayOfWeek:
                  validatedData.recurrence.monthlyDayOfWeek ?? null,
                monthlyWeeks: validatedData.recurrence.monthlyWeeks || [],
              },
            },
          }),
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
        recurrenceRule: true,
      },
    });

    if (event.isRecurring && event.recurrenceRule) {
      await generateInstancesForEvent(event.id).catch((err) =>
        console.error("Failed to generate instances for new event:", err)
      );
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
