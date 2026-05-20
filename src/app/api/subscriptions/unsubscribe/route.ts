import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit({
      key: `subscriptions:unsub:${ip}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const body = await request.json();
    const { email } = schema.parse(body);
    const canonical = email.toLowerCase().trim();

    await prisma.subscription.deleteMany({
      where: { email: canonical },
    });

    return NextResponse.json({
      message: "You have been unsubscribed from event emails.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not unsubscribe." }, { status: 500 });
  }
}
