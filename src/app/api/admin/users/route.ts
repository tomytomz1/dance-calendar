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

    const page = Math.max(Number(pageParam) || 1, 1);
    const rawLimit = Number(limitParam) || 50;
    const limit = Math.min(Math.max(rawLimit, 1), 200);
    const skip = (page - 1) * limit;

    const [organizers, dancers, totalDancers] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "ORGANIZER",
        },
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
        skip,
      }),
      prisma.user.findMany({
        where: { role: "USER" },
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.user.count({
        where: { role: "USER" },
      }),
    ]);

    return NextResponse.json({
      organizers,
      totalDancers,
      dancers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
