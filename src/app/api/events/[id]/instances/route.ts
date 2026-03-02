import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInstancesForEvent, getUpcomingInstances } from "@/lib/recurrence";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const instances = await getUpcomingInstances(id, limit);

    return NextResponse.json(instances);
  } catch (error) {
    console.error("Error fetching instances:", error);
    return NextResponse.json(
      { error: "Failed to fetch instances" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { organizerId: true, isRecurring: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!event.isRecurring) {
      return NextResponse.json(
        { error: "Event is not recurring" },
        { status: 400 }
      );
    }

    const count = await generateInstancesForEvent(id);

    return NextResponse.json({
      message: `Generated ${count} instances`,
      count,
    });
  } catch (error) {
    console.error("Error generating instances:", error);
    return NextResponse.json(
      { error: "Failed to generate instances" },
      { status: 500 }
    );
  }
}
