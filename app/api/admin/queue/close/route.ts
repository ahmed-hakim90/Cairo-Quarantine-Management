import { listOffices } from "@/lib/office-requests/store";
import { authorizeCronRequest } from "@/lib/cron/authorize";
import { closeDailyQueue, getTodayKey } from "@/lib/queue/queue-service";
import { noStoreJson } from "@/lib/security/admin-request";

async function parseCronBody(request: Request): Promise<{
  officeId?: string;
  date?: string;
}> {
  if (request.method === "GET") {
    const url = new URL(request.url);
    return {
      officeId: url.searchParams.get("officeId")?.trim() || undefined,
      date: url.searchParams.get("date")?.trim() || undefined,
    };
  }
  try {
    return (await request.json()) as { officeId?: string; date?: string };
  } catch {
    return {};
  }
}

async function handleQueueClose(request: Request) {
  const denied = authorizeCronRequest(request, "DAILY_QUEUE_CRON_SECRET");
  if (denied) return denied;

  const body = await parseCronBody(request);
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

export async function POST(request: Request) {
  return handleQueueClose(request);
}

export async function GET(request: Request) {
  return handleQueueClose(request);
}
