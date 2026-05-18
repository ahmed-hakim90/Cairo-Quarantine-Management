import { scanAndNotifyQueueWatches } from "@/lib/queue/queue-notify";
import { bearerToken, safeTokenEquals } from "@/lib/security/bearer-token";
import { noStoreJson } from "@/lib/security/admin-request";

export async function POST(request: Request) {
  const expected = process.env.QUEUE_NOTIFY_CRON_SECRET?.trim();
  if (!expected) {
    return noStoreJson(
      { error: "QUEUE_NOTIFY_CRON_SECRET غير مضبوط." },
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

  try {
    const result = await scanAndNotifyQueueWatches({
      officeId: body.officeId?.trim(),
      date: body.date?.trim(),
    });
    return noStoreJson(result);
  } catch (e) {
    return noStoreJson(
      { error: e instanceof Error ? e.message : "فشل مسح التنبيهات." },
      { status: 500 },
    );
  }
}
