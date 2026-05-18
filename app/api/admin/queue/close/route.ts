import { listOffices } from "@/lib/office-requests/store";
import { closeDailyQueue, getTodayKey } from "@/lib/queue/queue-service";
import { bearerToken, safeTokenEquals } from "@/lib/security/bearer-token";
import { noStoreJson } from "@/lib/security/admin-request";

export async function POST(request: Request) {
  const expected = process.env.DAILY_QUEUE_CRON_SECRET?.trim();
  if (!expected) {
    return noStoreJson(
      { error: "DAILY_QUEUE_CRON_SECRET غير مضبوط." },
      { status: 500 },
    );
  }
  if (!safeTokenEquals(bearerToken(request), expected)) {
    return noStoreJson({ error: "غير مصرح." }, { status: 401 });
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
      return noStoreJson({ closed: [result] });
    }

    const offices = await listOffices({ includeInactive: false });
    const closed = await Promise.all(
      offices.map((office) => closeDailyQueue(office.id, date)),
    );
    return noStoreJson({ closed });
  } catch (e) {
    return noStoreJson(
      { error: e instanceof Error ? e.message : "فشل إغلاق الطابور." },
      { status: 500 },
    );
  }
}
