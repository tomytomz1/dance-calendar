import { timingSafeEqual } from "crypto";

export function verifyCronRequest(authHeader: string | null): {
  ok: boolean;
  status: number;
  body?: Record<string, string>;
} {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return {
      ok: false,
      status: 503,
      body: { error: "CRON_SECRET is not configured" },
    };
  }

  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const received = Buffer.from(authHeader ?? "", "utf8");

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }

  return { ok: true, status: 200 };
}
