import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
