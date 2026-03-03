import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [organizers, dancers] = await Promise.all([
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
      prisma.user.findMany({
        where: { role: "USER" },
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      organizers,
      totalDancers: dancers.length,
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
