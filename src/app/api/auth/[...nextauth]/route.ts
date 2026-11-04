import { handlers } from "@/lib/auth";
import { rateLimitOr429 } from "@/lib/api-rate-limit";
import type { NextRequest } from "next/server";

export const { GET } = handlers;
export async function POST(request: NextRequest) {
  if (new URL(request.url).pathname.endsWith("/callback/credentials")) {
    const limited = rateLimitOr429(request, { scope: "auth:credentials", limit: 10, windowMs: 60000 });
    if (limited) return limited;
  }
  return handlers.POST(request);
}
