import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkEventConflicts, getConflictMessage } from "@/lib/conflicts";
import { rateLimitOr429 } from "@/lib/api-rate-limit";
import { z } from "zod";

const conflictCheckSchema = z.object({
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
  city: z.string().min(1, "City is required"),
  venue: z.string().optional(),
  excludeEventId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimitOr429(request, {
      scope: "events:conflicts",
      userId: session.user.id,
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;

    const body = await request.json();
    const validatedData = conflictCheckSchema.parse(body);

    const result = await checkEventConflicts(
      validatedData.startTime,
      validatedData.endTime,
      validatedData.city.trim(),
      validatedData.venue,
      validatedData.excludeEventId
    );

    return NextResponse.json({
      ...result,
      message: getConflictMessage(result, true),
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
