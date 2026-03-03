import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [organizers, totalUsers] = await Promise.all([
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
      }),
      prisma.user.count({
        where: { role: "USER" },
      }),
    ]);

    return NextResponse.json({ organizers, totalUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
