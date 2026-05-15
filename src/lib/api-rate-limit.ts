import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export type RateLimitApiOptions = {
  /** Unique prefix per route/method, e.g. "events:post" */
  scope: string;
  userId?: string | null;
  limit: number;
  windowMs: number;
};

/**
 * Returns a 429 NextResponse if rate limited, otherwise null.
 * Prefer user-scoped keys when userId is present to avoid shared NAT buckets.
 */
export function rateLimitOr429(
  request: Request,
  { scope, userId, limit, windowMs }: RateLimitApiOptions
): NextResponse | null {
  const ip = getClientIp(request);
  const key = userId
    ? `${scope}:user:${userId}`
    : `${scope}:ip:${ip}`;

  const result = checkRateLimit({ key, limit, windowMs });

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(
            (result.resetAt - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  return null;
}
