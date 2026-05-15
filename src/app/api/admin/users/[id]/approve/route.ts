import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitOr429 } from "@/lib/api-rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postLimited = rateLimitOr429(request, {
      scope: "admin:users:approve",
      userId: session.user.id,
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (postLimited) return postLimited;

    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Only organizer accounts can be approved" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { verified: true },
    });

    return NextResponse.json({
      message: "Organizer approved successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("Error approving user:", error);
    return NextResponse.json(
      { error: "Failed to approve user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const delLimited = rateLimitOr429(request, {
      scope: "admin:users:revoke",
      userId: session.user.id,
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (delLimited) return delLimited;

    const revokeTarget = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!revokeTarget) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (revokeTarget.role !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Only organizer accounts can have verification revoked" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { verified: false },
    });

    return NextResponse.json({
      message: "Organizer verification revoked",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("Error revoking verification:", error);
    return NextResponse.json(
      { error: "Failed to revoke verification" },
      { status: 500 }
    );
  }
}
