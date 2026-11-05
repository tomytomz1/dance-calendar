import { NextResponse } from "next/server";
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
      scope: "admin:events:pending:get",
      userId: session.user.id,
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = Math.max(Number(pageParam) || 1, 1);
    const rawLimit = Number(limitParam) || 50;
    const limit = Math.min(Math.max(rawLimit, 1), 200);
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([prisma.event.findMany({
      where: {
        status: "PENDING_APPROVAL",
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: limit,
      skip,
    }), prisma.event.count({ where: { status: "PENDING_APPROVAL" } })]);

    return NextResponse.json(events, { headers: { "X-Total-Count": String(total) } });
  } catch (error) {
    console.error("Error fetching pending events:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending events" },
      { status: 500 }
    );
  }
}
