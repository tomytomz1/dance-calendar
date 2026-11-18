import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitOr429 } from "@/lib/api-rate-limit";
import { optionalProfileWebsite } from "@/lib/zod-url";
import { normalizeWebsite, PROFILE_LIMITS } from "@/lib/profile-input";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(PROFILE_LIMITS.nameMin, `Name must be at least ${PROFILE_LIMITS.nameMin} characters`)
    .optional(),
  bio: z
    .string()
    .max(PROFILE_LIMITS.bioMax, `Bio must be ${PROFILE_LIMITS.bioMax} characters or less`)
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .max(PROFILE_LIMITS.phoneMax, `Phone must be ${PROFILE_LIMITS.phoneMax} characters or less`)
    .optional()
    .nullable(),
  // Accept "yourstudio.com" by adding https:// before validating.
  website: z.preprocess(
    (v) => (typeof v === "string" ? normalizeWebsite(v) : v),
    optionalProfileWebsite
  ),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        verified: true,
        bio: true,
        phone: true,
        website: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimitOr429(request, {
      scope: "profile:patch",
      userId: session.user.id,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (limited) return limited;

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    if (validatedData.website === "") {
      validatedData.website = null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        verified: true,
        bio: true,
        phone: true,
        website: true,
        createdAt: true,
      },
    });

    // Organizer names appear on cached pages (e.g. the homepage); refresh them.
    if (validatedData.name !== undefined && updatedUser.role !== "USER") {
      revalidatePath("/");
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      const issue = zodError.issues[0];
      return NextResponse.json(
        {
          error: issue?.message || "Validation error",
          field: typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
        },
        { status: 400 }
      );
    }

    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
