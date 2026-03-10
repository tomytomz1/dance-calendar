import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const status = searchParams.get("status") || undefined;

    const page = Math.max(Number(pageParam) || 1, 1);
    const rawLimit = Number(limitParam) || 50;
    const limit = Math.min(Math.max(rawLimit, 1), 200);
    const skip = (page - 1) * limit;

    const where = {
      ...(status ? { status } : {}),
    } as const;

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
