import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { EventStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitOr429 } from "@/lib/api-rate-limit";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimitOr429(request, {
      scope: "admin:events:get",
      userId: session.user.id,
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const statusParam = searchParams.get("status");

    const status =
      statusParam && Object.values(EventStatus).includes(statusParam as EventStatus)
        ? (statusParam as EventStatus)
        : undefined;

    const page = Math.max(Number(pageParam) || 1, 1);
    const rawLimit = Number(limitParam) || 50;
    const limit = Math.min(Math.max(rawLimit, 1), 200);
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {};
    if (status) {
      where.status = status;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
        recurrenceRule: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching all events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
