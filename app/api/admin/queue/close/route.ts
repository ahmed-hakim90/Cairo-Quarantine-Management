import { NextResponse } from "next/server";
import { listOffices } from "@/lib/office-requests/store";
import { closeDailyQueue, getTodayKey } from "@/lib/queue/queue-service";

function bearerToken(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" ? token ?? "" : "";
}

export async function POST(request: Request) {
  const expected = process.env.DAILY_QUEUE_CRON_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "DAILY_QUEUE_CRON_SECRET غير مضبوط." },
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

  const date = body.date?.trim() || getTodayKey();
  const officeId = body.officeId?.trim();

  try {
    if (officeId) {
      const result = await closeDailyQueue(officeId, date);
      return NextResponse.json({ closed: [result] });
    }

    const offices = await listOffices({ includeInactive: false });
    const closed = await Promise.all(
      offices.map((office) => closeDailyQueue(office.id, date)),
    );
    return NextResponse.json({ closed });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل إغلاق الطابور." },
      { status: 500 },
    );
  }
}
