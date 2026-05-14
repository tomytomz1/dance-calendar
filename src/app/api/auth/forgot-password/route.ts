import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generatePasswordResetEmail } from "@/lib/email";
import {
  createPasswordResetToken,
  storePasswordResetToken,
} from "@/lib/password-reset";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const SUCCESS_MESSAGE =
  "If an account exists with that email, you will receive a password reset link shortly.";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipResult = checkRateLimit({
      key: `forgot-password:ip:${ip}`,
      limit: 5,
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
    const { email } = forgotPasswordSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    const emailResult = checkRateLimit({
      key: `forgot-password:email:${normalizedEmail}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });

    if (!emailResult.allowed) {
      return NextResponse.json({ message: SUCCESS_MESSAGE });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true, password: true },
    });

    if (user?.password) {
      const token = createPasswordResetToken();
      await storePasswordResetToken(user.email, token);

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
      const { subject, html } = generatePasswordResetEmail(user.name, resetUrl);

      await sendEmail({
        to: user.email,
        subject,
        html,
      });
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
