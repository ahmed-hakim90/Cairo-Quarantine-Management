import { checkRateLimit } from "@/lib/rate-limit";

type RateLimitResult = ReturnType<typeof checkRateLimit>;
import { checkFirestoreRateLimit } from "@/lib/rate-limit-firestore";

export type UnifiedRateLimitArgs = {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
};

function rateLimitBackend(): "memory" | "firestore" | "both" {
  const raw = process.env.RATE_LIMIT_BACKEND?.trim().toLowerCase();
  if (raw === "firestore") return "firestore";
  if (raw === "both") return "both";
  return "memory";
}

export async function checkUnifiedRateLimit(
  args: UnifiedRateLimitArgs,
): Promise<RateLimitResult> {
  const backend = rateLimitBackend();

  if (backend === "firestore" || backend === "both") {
    const fs = await checkFirestoreRateLimit(args);
    if (!fs.allowed) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: fs.retryAfterSeconds,
      };
    }
  }

  if (backend === "memory" || backend === "both") {
    return checkRateLimit(args);
  }

  return checkRateLimit(args);
}
