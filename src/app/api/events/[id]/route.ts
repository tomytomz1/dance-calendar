import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInstancesForEvent } from "@/lib/recurrence";
import { generateUniqueEventSlug } from "@/lib/slug";
import { organizerEditStatus } from "@/lib/event-status";
import { rateLimitOr429 } from "@/lib/api-rate-limit";
import { updateEventSchema } from "@/lib/event-validation";
import { z } from "zod";
import { canManageEvents } from "@/lib/event-authorization";

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
    if (!canManageEvents(session.user)) {
      return NextResponse.json({ error: "Verified organizer access is required" }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { organizerId: true, status: true, slug: true, startTime: true, endTime: true, isRecurring: true, recurrenceRule: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isOwner = event.organizerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const patchLimited = rateLimitOr429(request, {
      scope: "events:patch",
      userId: session.user.id,
      limit: 60,
      windowMs: 60 * 60 * 1000,
    });
    if (patchLimited) return patchLimited;

    const body = await request.json();
    const validatedData = updateEventSchema.parse(body);

    if ((validatedData.endTime ?? event.endTime) <= (validatedData.startTime ?? event.startTime)) {
      return NextResponse.json({ error: "End must be after the start." }, { status: 400 });
    }
    if ((validatedData.isRecurring ?? event.isRecurring) && !validatedData.recurrence && !event.recurrenceRule) {
      return NextResponse.json({ error: "A recurring event requires a recurrence rule." }, { status: 400 });
    }

    // Organizer edits stay published (no admin re-review); admins set any status.
    const nextStatus = isAdmin
      ? validatedData.status
      : organizerEditStatus(validatedData.status, event.status);

    const { recurrence, ...eventData } = validatedData;
    delete eventData.status; // applied via nextStatus below

    let slug: string | null | undefined;
    // Titles can change without invalidating shared links and cached listings.
    if (eventData.title && !event.slug) {
      slug = await generateUniqueEventSlug(eventData.title);
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...eventData,
        ...(eventData.imageUrl === "" && { imageUrl: null }),
        ...(eventData.ticketUrl === "" && { ticketUrl: null }),
        ...(slug !== undefined && { slug }),
        ...(nextStatus !== undefined && { status: nextStatus }),
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
      (updatedEvent.isRecurring || event.isRecurring) &&
      ((nextStatus === "APPROVED" && event.status !== "APPROVED") ||
        !!recurrence || !!eventData.startTime || !!eventData.endTime ||
        (eventData.isRecurring !== undefined && eventData.isRecurring !== event.isRecurring));

    if (shouldRegenerateInstances) {
      await generateInstancesForEvent(id, { replaceFuture: true }).catch((err) =>
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
    if (!canManageEvents(session.user)) {
      return NextResponse.json({ error: "Verified organizer access is required" }, { status: 403 });
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

    const deleteLimited = rateLimitOr429(request, {
      scope: "events:delete",
      userId: session.user.id,
      limit: 60,
      windowMs: 60 * 60 * 1000,
    });
    if (deleteLimited) return deleteLimited;

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
