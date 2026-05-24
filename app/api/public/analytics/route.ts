import { ingestPublicAnalyticsEvent } from "@/lib/analytics/public-analytics-store";
import { parsePublicAnalyticsIngestBody } from "@/lib/analytics/public-event-schema";
import { rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { checkUnifiedRateLimit } from "@/lib/rate-limit-unified";
import { noStoreJson, rejectOversizedRequest } from "@/lib/security/admin-request";

const MAX_BODY_BYTES = 8_192;

export async function POST(request: Request) {
  const oversized = rejectOversizedRequest(request, MAX_BODY_BYTES);
  if (oversized) return oversized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parsePublicAnalyticsIngestBody(body);
  if (!parsed.ok) {
    return noStoreJson({ error: parsed.error }, { status: 400 });
  }

  const rateLimit = await checkUnifiedRateLimit({
    scope: "public-analytics",
    key: `${rateLimitKeyFromHeaders(request.headers, "public-analytics")}:${parsed.value.sessionId}`,
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return noStoreJson(
      { error: "rate_limited", retryAfterSeconds: rateLimit.retryAfterSeconds },
      { status: 429 },
    );
  }

  const result = await ingestPublicAnalyticsEvent(parsed.value, {
    userAgent: request.headers.get("user-agent"),
  });
  if (!result.ok) {
    return noStoreJson({ error: result.error }, { status: 503 });
  }

  return noStoreJson({ ok: true });
}
