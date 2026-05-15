import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInstancesForEvent } from "@/lib/recurrence";
import { generateUniqueEventSlug } from "@/lib/slug";
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

const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  danceStyles: z.array(z.string()).min(1).optional(),
  venue: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startTime: z.string().transform((val) => new Date(val)).optional(),
  endTime: z.string().transform((val) => new Date(val)).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  ticketUrl: z.string().url().optional().or(z.literal("")),
  price: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "CANCELLED"]).optional(),
  recurrence: recurrenceSchema.optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
          },
        },
        recurrenceRule: true,
        instances: {
          where: {
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: "asc" },
          take: 10,
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isOwner = session?.user?.id === event.organizerId;
    const isAdmin = session?.user?.role === "ADMIN";

    if (isOwner || isAdmin) {
      return NextResponse.json(event);
    }

    if (event.status !== "APPROVED") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { organizer, ...rest } = event;
    const publicPayload = {
      ...rest,
      organizer: {
        id: organizer.id,
        name: organizer.name,
        image: organizer.image,
        bio: organizer.bio,
      },
    };

    return NextResponse.json(publicPayload);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isOwner = event.organizerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateEventSchema.parse(body);

    if (!isAdmin && validatedData.status === "APPROVED") {
      delete validatedData.status;
    }

    const { recurrence, ...eventData } = validatedData;

    let slug: string | null | undefined;
    if (eventData.title) {
      slug = await generateUniqueEventSlug(eventData.title);
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...eventData,
        ...(slug !== undefined && { slug }),
        ...(isOwner && !isAdmin && { status: "PENDING_APPROVAL" }),
        ...(recurrence && {
          recurrenceRule: {
            upsert: {
              create: {
                frequency: recurrence.frequency,
                interval: recurrence.interval,
                daysOfWeek: recurrence.daysOfWeek || [],
                until: recurrence.until ?? null,
                count: recurrence.count,
                monthlyPattern: recurrence.monthlyPattern ?? "BY_DATE",
                monthlyDayOfWeek: recurrence.monthlyDayOfWeek ?? null,
                monthlyWeeks: recurrence.monthlyWeeks || [],
              },
              update: {
                frequency: recurrence.frequency,
                interval: recurrence.interval,
                daysOfWeek: recurrence.daysOfWeek || [],
                until: recurrence.until ?? null,
                count: recurrence.count,
                monthlyPattern: recurrence.monthlyPattern ?? "BY_DATE",
                monthlyDayOfWeek: recurrence.monthlyDayOfWeek ?? null,
                monthlyWeeks: recurrence.monthlyWeeks || [],
              },
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

    const shouldRegenerateInstances =
      updatedEvent.isRecurring &&
      updatedEvent.recurrenceRule &&
      (validatedData.status === "APPROVED" || !!recurrence);

    if (shouldRegenerateInstances) {
      try {
        await prisma.eventInstance.deleteMany({
          where: {
            eventId: id,
            startTime: { gt: new Date() },
          },
        });
      } catch (err) {
        console.error("Failed to clear existing future instances:", err);
      }

      await generateInstancesForEvent(id).catch((err) =>
        console.error("Failed to generate instances on update:", err)
      );
    }

    return NextResponse.json(updatedEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isOwner = event.organizerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
