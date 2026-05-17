import { NextResponse } from "next/server";
import {
  deleteQueueWatch,
  registerQueueWatch,
} from "@/lib/queue/queue-notify";
import { checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";

function rateLimitResponse(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKeyFromHeaders(request.headers, "queue-watch"),
    limit: 30,
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
  return null;
}

export async function POST(request: Request) {
  const limited = rateLimitResponse(request);
  if (limited) return limited;

  let body: { ticketId?: string; fcmToken?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const ticketId = String(body.ticketId ?? "").trim();
  const fcmToken = String(body.fcmToken ?? "").trim();
  if (!ticketId || !fcmToken) {
    return NextResponse.json(
      { error: "ticketId و fcmToken مطلوبان." },
      { status: 400 },
    );
  }

  try {
    await registerQueueWatch({ ticketId, fcmToken });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "تعذر تسجيل المتابعة." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const limited = rateLimitResponse(request);
  if (limited) return limited;

  const ticketId = new URL(request.url).searchParams.get("ticketId")?.trim();
  if (!ticketId) {
    return NextResponse.json({ error: "ticketId مطلوب." }, { status: 400 });
  }

  try {
    await deleteQueueWatch(ticketId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "تعذر إلغاء المتابعة." },
      { status: 500 },
    );
  }
}
