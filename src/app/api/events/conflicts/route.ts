import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkEventConflicts, getConflictMessage } from "@/lib/conflicts";
import { z } from "zod";

const conflictCheckSchema = z.object({
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
  city: z.string().optional(),
  venue: z.string().optional(),
  excludeEventId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = conflictCheckSchema.parse(body);

    const result = await checkEventConflicts(
      validatedData.startTime,
      validatedData.endTime,
      validatedData.city || undefined,
      validatedData.venue,
      validatedData.excludeEventId
    );

    return NextResponse.json({
      ...result,
      message: getConflictMessage(result, !!validatedData.city?.trim()),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Error checking conflicts:", error);
    return NextResponse.json(
      { error: "Failed to check conflicts" },
      { status: 500 }
    );
  }
}
