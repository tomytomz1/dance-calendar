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
    const limitParam = searchParams.get("limit");
    const rawLimit = Number(limitParam) || 50;
    const limit = Math.min(Math.max(rawLimit, 1), 200);

    const organizerPage = Math.max(
      Number(searchParams.get("organizerPage")) ||
        Number(searchParams.get("page")) ||
        1,
      1
    );
    const dancerPage = Math.max(
      Number(searchParams.get("dancerPage")) ||
        Number(searchParams.get("page")) ||
        1,
      1
    );

    const organizerSkip = (organizerPage - 1) * limit;
    const dancerSkip = (dancerPage - 1) * limit;

    const [organizers, dancers, totalOrganizers, totalDancers] =
      await Promise.all([
        prisma.user.findMany({
          where: { role: "ORGANIZER" },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            verified: true,
            createdAt: true,
            _count: {
              select: { events: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: organizerSkip,
        }),
        prisma.user.findMany({
          where: { role: "USER" },
          select: { id: true, email: true, name: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: dancerSkip,
        }),
        prisma.user.count({ where: { role: "ORGANIZER" } }),
        prisma.user.count({ where: { role: "USER" } }),
      ]);

    return NextResponse.json({
      organizers,
      dancers,
      totalOrganizers,
      totalDancers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
