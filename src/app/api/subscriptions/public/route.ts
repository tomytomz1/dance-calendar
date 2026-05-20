import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const publicSubscribeSchema = z.object({
  email: z.string().email(),
  cities: z.array(z.string()).max(20).optional().default([]),
  danceStyles: z.array(z.string()).max(20).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit({
      key: `subscriptions:public:${ip}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = publicSubscribeSchema.parse(body);
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.subscription.findUnique({
      where: { email },
    });

    if (existing) {
      await prisma.subscription.update({
        where: { email },
        data: {
          cities: data.cities,
          danceStyles: data.danceStyles,
          emailNotifications: true,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          email,
          cities: data.cities,
          danceStyles: data.danceStyles,
          emailNotifications: true,
          weeklyDigest: false,
        },
      });
    }

    return NextResponse.json({
      message: "You're subscribed to Michigan dance event alerts.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("public subscribe:", error);
    return NextResponse.json(
      { error: "Could not subscribe. Please try again." },
      { status: 500 }
    );
  }
}
