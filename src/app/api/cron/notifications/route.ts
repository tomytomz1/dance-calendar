import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateNewEventEmail, generateEventReminderEmail } from "@/lib/email";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { getPublicAppUrl } from "@/lib/app-url";
import { verifyCronRequest } from "@/lib/cron-auth";

export async function GET(request: Request) {
  const headersList = await headers();
  const cron = verifyCronRequest(headersList.get("authorization"));
  if (!cron.ok) {
    return NextResponse.json(cron.body ?? { error: "Unauthorized" }, {
      status: cron.status,
    });
  }

  let appBaseUrl: string;
  try {
    appBaseUrl = getPublicAppUrl();
  } catch {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL or NEXTAUTH_URL must be set for cron emails" },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "new-events";

    if (type === "new-events") {
      return await sendNewEventNotifications(appBaseUrl);
    } else if (type === "reminders") {
      return await sendEventReminders(appBaseUrl);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}

async function sendNewEventNotifications(appBaseUrl: string) {
  const yesterday = addDays(new Date(), -1);

  const newEvents = await prisma.event.findMany({
    where: {
      status: "APPROVED",
      createdAt: { gte: yesterday },
    },
    include: {
      organizer: { select: { name: true } },
    },
  });

  if (newEvents.length === 0) {
    return NextResponse.json({ message: "No new events to notify about" });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { emailNotifications: true },
  });

  let sentCount = 0;

  for (const event of newEvents) {
    const matchingSubscribers = subscriptions.filter((sub) => {
      const styleMatch =
        sub.danceStyles.length === 0 ||
        sub.danceStyles.some((style) => event.danceStyles.includes(style));
      const cityMatch =
        sub.cities.length === 0 ||
        sub.cities.some((city) =>
          event.city.toLowerCase().includes(city.toLowerCase())
        );
      return styleMatch && cityMatch;
    });

    for (const subscriber of matchingSubscribers) {
      const { subject, html } = generateNewEventEmail(
        event.title,
        format(event.startTime, "EEEE, MMMM d, yyyy"),
        format(event.startTime, "h:mm a"),
        event.venue,
        event.city,
        event.danceStyles,
        `${appBaseUrl}/event/${event.slug ?? event.id}`,
        appBaseUrl
      );

      const result = await sendEmail({
        to: subscriber.email,
        subject,
        html,
      });

      if (result.success) {
        sentCount++;
        await prisma.notificationLog.create({
          data: {
            email: subscriber.email,
            type: "new-event",
            eventId: event.id,
            status: "sent",
          },
        });
      }
    }
  }

  return NextResponse.json({
    message: `Sent ${sentCount} new event notifications`,
    eventsProcessed: newEvents.length,
  });
}

async function sendEventReminders(appBaseUrl: string) {
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStart = startOfDay(tomorrow);
  const tomorrowEnd = endOfDay(tomorrow);

  const upcomingEvents = await prisma.event.findMany({
    where: {
      status: "APPROVED",
      startTime: {
        gte: tomorrowStart,
        lte: tomorrowEnd,
      },
    },
  });

  if (upcomingEvents.length === 0) {
    return NextResponse.json({ message: "No events tomorrow" });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { emailNotifications: true },
  });

  let sentCount = 0;

  for (const event of upcomingEvents) {
    const matchingSubscribers = subscriptions.filter((sub) => {
      const styleMatch =
        sub.danceStyles.length === 0 ||
        sub.danceStyles.some((style) => event.danceStyles.includes(style));
      const cityMatch =
        sub.cities.length === 0 ||
        sub.cities.some((city) =>
          event.city.toLowerCase().includes(city.toLowerCase())
        );
      return styleMatch && cityMatch;
    });

    for (const subscriber of matchingSubscribers) {
      const alreadySent = await prisma.notificationLog.findFirst({
        where: {
          email: subscriber.email,
          eventId: event.id,
          type: "reminder",
        },
      });

      if (alreadySent) continue;

      const { subject, html } = generateEventReminderEmail(
        event.title,
        format(event.startTime, "EEEE, MMMM d, yyyy"),
        format(event.startTime, "h:mm a"),
        event.venue,
        event.address,
        `${appBaseUrl}/event/${event.slug ?? event.id}`
      );

      const result = await sendEmail({
        to: subscriber.email,
        subject,
        html,
      });

      if (result.success) {
        sentCount++;
        await prisma.notificationLog.create({
          data: {
            email: subscriber.email,
            type: "reminder",
            eventId: event.id,
            status: "sent",
          },
        });
      }
    }
  }

  return NextResponse.json({
    message: `Sent ${sentCount} reminder notifications`,
    eventsProcessed: upcomingEvents.length,
  });
}
