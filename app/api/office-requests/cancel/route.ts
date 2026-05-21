import { NextResponse } from "next/server";
import { cancelRequestByCitizen } from "@/lib/office-requests/store";
import { rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { checkUnifiedRateLimit } from "@/lib/rate-limit-unified";
import {
  bodyTooLargeResponse,
  isRequestBodyTooLarge,
} from "@/lib/api/request-body-limit";

const MAX_BODY_BYTES = 512;

export async function POST(request: Request) {
  if (isRequestBodyTooLarge(request, MAX_BODY_BYTES)) {
    return bodyTooLargeResponse();
  }

  const rateLimit = await checkUnifiedRateLimit({
    scope: "office-request-cancel",
    key: rateLimitKeyFromHeaders(request.headers, "office-request-cancel"),
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const id =
    typeof (body as { id?: unknown })?.id === "string"
      ? (body as { id: string }).id.trim()
      : "";
  const phone =
    typeof (body as { phone?: unknown })?.phone === "string"
      ? (body as { phone: string }).phone.trim()
      : "";

  if (!id || !phone) {
    return NextResponse.json(
      { ok: false, error: "bad_params" },
      { status: 400 },
    );
  }

  const result = await cancelRequestByCitizen({ id, phone });
  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "service_unavailable"
          ? 503
          : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
