import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [pendingEvents, pendingOrganizers] = await Promise.all([
      prisma.event.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.user.count({ where: { role: "ORGANIZER", verified: false } }),
    ]);

    return NextResponse.json({ pendingEvents, pendingOrganizers });
  } catch (error) {
    console.error("Error fetching pending counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending counts" },
      { status: 500 }
    );
  }
}
