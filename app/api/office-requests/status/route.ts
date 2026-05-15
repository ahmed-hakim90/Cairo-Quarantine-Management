import { NextResponse } from "next/server";
import { getPublicRequestStatus } from "@/lib/office-requests/store";
import type { PublicOfficeRequestStatus } from "@/lib/office-requests/types";
import { checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";

type StatusLookup = {
  id: string;
  phone: string;
};

const MAX_BODY_BYTES = 4096;
const MAX_LOOKUPS = 20;
const MAX_ID_LENGTH = 120;
const MAX_PHONE_LENGTH = 30;

function isLookup(value: unknown): value is StatusLookup {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.phone !== "string") {
    return false;
  }
  const id = item.id.trim();
  const phone = item.phone.trim();
  return (
    id.length > 0 &&
    id.length <= MAX_ID_LENGTH &&
    phone.length > 0 &&
    phone.length <= MAX_PHONE_LENGTH
  );
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKeyFromHeaders(request.headers, "office-request-status"),
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { requests: [], missing: [], error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const contentLength = Number.parseInt(
    request.headers.get("content-length") ?? "",
    10,
  );
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { requests: [], missing: [], error: "Request body too large." },
      { status: 413 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { requests: [], missing: [], error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const rawRequests = (body as { requests?: unknown })?.requests;
  if (!Array.isArray(rawRequests)) {
    return NextResponse.json(
      { requests: [], missing: [], error: "requests must be an array." },
      { status: 400 },
    );
  }
  if (rawRequests.length > MAX_LOOKUPS) {
    return NextResponse.json(
      { requests: [], missing: [], error: "Too many requests." },
      { status: 400 },
    );
  }

  const lookups = rawRequests.filter(isLookup);
  if (lookups.length !== rawRequests.length) {
    return NextResponse.json(
      { requests: [], missing: [], error: "Invalid request lookup." },
      { status: 400 },
    );
  }

  const results = await Promise.all(
    lookups.map(async (lookup) => ({
      id: lookup.id.trim(),
      request: await getPublicRequestStatus({
        id: lookup.id.trim(),
        phone: lookup.phone.trim(),
      }),
    })),
  );

  const requests: PublicOfficeRequestStatus[] = [];
  const missing: string[] = [];

  for (const result of results) {
    if (result.request) {
      requests.push(result.request);
    } else {
      missing.push(result.id);
    }
  }

  return NextResponse.json({ requests, missing });
}
