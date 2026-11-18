import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), handleUpload: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/api-rate-limit", () => ({ rateLimitOr429: () => null }));
vi.mock("@vercel/blob/client", () => ({ handleUpload: mocks.handleUpload }));

import { POST } from "@/app/api/uploads/event-image/route";
import { eventImagePathFor, isAllowedEventImagePath } from "@/lib/event-image-upload";
import { organizerImageUrl } from "@/lib/dance-images";

const tokenRequest = (pathname = "event-images/flyer.jpg") =>
  new Request("https://isolated.invalid/api/uploads/event-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: { pathname, callbackUrl: "", clientPayload: null, multipart: false },
    }),
  });

describe("event photo upload rules", () => {
  it("builds safe pathnames under event-images/", () => {
    expect(eventImagePathFor("IMG_5863.HEIC", "image/jpeg")).toBe("event-images/img-5863.jpg");
    expect(eventImagePathFor("../../Flyer Final!!.png", "image/png")).toBe("event-images/flyer-final.png");
    expect(eventImagePathFor(".jpg", "image/webp")).toBe("event-images/event-photo.webp");
  });

  it("only accepts image paths inside the folder", () => {
    expect(isAllowedEventImagePath("event-images/flyer.jpg")).toBe(true);
    expect(isAllowedEventImagePath("event-images/../secrets.jpg")).toBe(false);
    expect(isAllowedEventImagePath("other/flyer.jpg")).toBe(false);
    expect(isAllowedEventImagePath("event-images/page.html")).toBe(false);
  });

  it("treats uploaded Blob URLs as real photos", () => {
    expect(
      organizerImageUrl("https://abc123.public.blob.vercel-storage.com/event-images/flyer-x1Y2.jpg")
    ).toContain("blob.vercel-storage.com");
  });
});

describe("POST /api/uploads/event-image (mocked; no network or storage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
    mocks.handleUpload.mockResolvedValue({ type: "blob.generate-client-token", clientToken: "t" });
  });

  it.each([
    ["signed out", null, 401],
    ["regular user", { user: { id: "u", role: "USER", verified: true } }, 403],
    ["unverified organizer", { user: { id: "o", role: "ORGANIZER", verified: false } }, 403],
  ])("denies %s", async (_label, session, status) => {
    mocks.auth.mockResolvedValue(session);
    expect((await POST(tokenRequest())).status).toBe(status);
    expect(mocks.handleUpload).not.toHaveBeenCalled();
  });

  it("issues a restricted token to a verified organizer", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "o", role: "ORGANIZER", verified: true } });
    const response = await POST(tokenRequest());
    expect(response.status).toBe(200);
    const { onBeforeGenerateToken } = mocks.handleUpload.mock.calls[0][0];
    const options = await onBeforeGenerateToken("event-images/flyer.jpg", null, false);
    expect(options.allowedContentTypes).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(options.maximumSizeInBytes).toBe(8 * 1024 * 1024);
    expect(options.addRandomSuffix).toBe(true);
    await expect(onBeforeGenerateToken("elsewhere/x.jpg", null, false)).rejects.toThrow();
  });

  it("rejects completion callbacks and unknown request types", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "a", role: "ADMIN", verified: true } });
    const response = await POST(
      new Request("https://isolated.invalid/api/uploads/event-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "blob.upload-completed", payload: {} }),
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 503 when storage is not configured", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    mocks.auth.mockResolvedValue({ user: { id: "a", role: "ADMIN", verified: true } });
    expect((await POST(tokenRequest())).status).toBe(503);
  });
});
