import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateInstancesForEvent } from "@/lib/recurrence";

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recurringEvents = await prisma.event.findMany({
      where: {
        isRecurring: true,
        status: "APPROVED",
      },
      select: { id: true, title: true },
    });

    let totalInstances = 0;

    for (const event of recurringEvents) {
      const count = await generateInstancesForEvent(event.id);
      totalInstances += count;
    }

    return NextResponse.json({
      message: `Generated ${totalInstances} instances for ${recurringEvents.length} recurring events`,
      eventsProcessed: recurringEvents.length,
      instancesGenerated: totalInstances,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Failed to generate instances" },
      { status: 500 }
    );
  }
}
