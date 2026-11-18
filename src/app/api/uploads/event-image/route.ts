import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { rateLimitOr429 } from "@/lib/api-rate-limit";
import { EVENT_IMAGE_UPLOAD, isAllowedEventImagePath } from "@/lib/event-image-upload";

/**
 * Issues short-lived tokens so verified organizers can upload an event photo
 * straight from the browser to Vercel Blob. The photo URL is then saved with
 * the event through the normal event form; nothing is written here.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && (session.user.role !== "ORGANIZER" || !session.user.verified)) {
    return NextResponse.json(
      { error: "Only verified organizers can upload event photos." },
      { status: 403 }
    );
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Photo uploads are not available right now. Paste an image link instead." },
      { status: 503 }
    );
  }

  const limited = rateLimitOr429(request, {
    scope: "uploads:event-image",
    userId: session.user.id,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (body.type !== "blob.generate-client-token") {
    return NextResponse.json({ error: "Unsupported request" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAllowedEventImagePath(pathname)) {
          throw new Error("Invalid file name");
        }
        return {
          allowedContentTypes: EVENT_IMAGE_UPLOAD.allowedContentTypes,
          maximumSizeInBytes: EVENT_IMAGE_UPLOAD.maximumSizeInBytes,
          addRandomSuffix: true,
          validUntil: Date.now() + EVENT_IMAGE_UPLOAD.tokenTtlMs,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
