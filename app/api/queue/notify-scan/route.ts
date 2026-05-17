import { NextResponse } from "next/server";
import { scanAndNotifyQueueWatches } from "@/lib/queue/queue-notify";

function bearerToken(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" ? token ?? "" : "";
}

export async function POST(request: Request) {
  const expected = process.env.QUEUE_NOTIFY_CRON_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "QUEUE_NOTIFY_CRON_SECRET غير مضبوط." },
      { status: 500 },
    );
  }
  if (bearerToken(request) !== expected) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  let body: { officeId?: string; date?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const result = await scanAndNotifyQueueWatches({
      officeId: body.officeId?.trim(),
      date: body.date?.trim(),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل مسح التنبيهات." },
      { status: 500 },
    );
  }
}
