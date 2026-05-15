import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  isOrganizer: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipKey = `register:ip:${ip}`;

    const ipResult = checkRateLimit({
      key: ipKey,
      limit: 3,
      windowMs: 60 * 60 * 1000, // 3 registrations per IP per hour
    });

    if (!ipResult.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (ipResult.resetAt - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    const emailNormalized = validatedData.email.toLowerCase().trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: emailNormalized, mode: "insensitive" },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(validatedData.password);

    const user = await prisma.user.create({
      data: {
        email: emailNormalized,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.isOrganizer ? "ORGANIZER" : "USER",
        verified: !validatedData.isOrganizer,
      },
    });

    return NextResponse.json(
      {
        message: validatedData.isOrganizer
          ? "Registration successful! Your organizer account is pending approval."
          : "Registration successful!",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      return NextResponse.json(
        { error: zodError.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
