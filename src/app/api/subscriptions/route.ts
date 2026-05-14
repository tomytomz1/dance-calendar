import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const subscriptionSchema = z.object({
  email: z.string().email(),
  danceStyles: z.array(z.string()).optional().default([]),
  cities: z.array(z.string()).optional().default([]),
  emailNotifications: z.boolean().optional().default(true),
  weeklyDigest: z.boolean().optional().default(false),
});

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const key = `subscriptions:get:${ip}`;
    const result = checkRateLimit({
      key,
      limit: 20,
      windowMs: 60 * 1000, // 20 req/min per IP
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

    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email },
        ],
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const key = `subscriptions:post:${ip}`;
    const result = checkRateLimit({
      key,
      limit: 20,
      windowMs: 60 * 1000, // 20 req/min per IP
    });

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many subscription updates. Please try again later." },
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

    const session = await auth();
    const body = await request.json();
    const validatedData = subscriptionSchema.parse(body);

    const subscription = await prisma.subscription.upsert({
      where: { email: validatedData.email },
      update: {
        danceStyles: validatedData.danceStyles,
        cities: validatedData.cities,
        emailNotifications: validatedData.emailNotifications,
        weeklyDigest: validatedData.weeklyDigest,
        userId: session?.user.id,
      },
      create: {
        email: validatedData.email,
        danceStyles: validatedData.danceStyles,
        cities: validatedData.cities,
        emailNotifications: validatedData.emailNotifications,
        weeklyDigest: validatedData.weeklyDigest,
        userId: session?.user.id,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow unsubscribing the authenticated user's own subscription.
    // We don't surface whether a subscription existed to avoid leaking info.
    await prisma.subscription.deleteMany({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email },
        ],
      },
    });

    return NextResponse.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
