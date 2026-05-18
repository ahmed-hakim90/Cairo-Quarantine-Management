import { NextResponse } from "next/server";
import { isVpsApiEnabled } from "@/lib/api/vps-config";
import { vpsGetQueueTicketState } from "@/lib/api/vps-client";
import { getQueuePositionPublic } from "@/lib/queue/queue-position";
import { checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKeyFromHeaders(request.headers, "queue-position"),
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const ticketId = new URL(request.url).searchParams.get("ticketId")?.trim();
  if (!ticketId) {
    return NextResponse.json({ error: "ticketId مطلوب." }, { status: 400 });
  }

  try {
    const position = isVpsApiEnabled()
      ? await vpsGetQueueTicketState(ticketId)
      : await getQueuePositionPublic(ticketId);
    if (!position) {
      return NextResponse.json({ error: "التذكرة غير موجودة." }, { status: 404 });
    }
    return NextResponse.json(position);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "تعذر قراءة الموضع." },
      { status: 500 },
    );
  }
}
