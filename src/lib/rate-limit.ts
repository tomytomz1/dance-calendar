type RateLimitKey = string;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<RateLimitKey, Bucket>();

export type RateLimitOptions = {
  key: RateLimitKey;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim());
    if (parts[0]) return parts[0];
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  // Last resort: use remote address if exposed, or a constant.
  return "unknown";
}

