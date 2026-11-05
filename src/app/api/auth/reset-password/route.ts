import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import {
  verifyPasswordResetToken,
  resetPasswordWithToken,
} from "@/lib/password-reset";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipResult = checkRateLimit({
      key: `reset-password:ip:${ip}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    if (!ipResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
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
    const { token, password } = resetPasswordSchema.parse(body);

    const verified = await verifyPasswordResetToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    if (!(await resetPasswordWithToken(token, hashedPassword))) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Your password has been reset. You can now sign in.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
