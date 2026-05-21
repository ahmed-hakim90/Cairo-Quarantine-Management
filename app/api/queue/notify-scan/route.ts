import { authorizeCronRequest } from "@/lib/cron/authorize";
import { scanAndNotifyQueueWatches } from "@/lib/queue/queue-notify";
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

async function handleNotifyScan(request: Request) {
  const denied = authorizeCronRequest(request, "QUEUE_NOTIFY_CRON_SECRET");
  if (denied) return denied;

  const body = await parseCronBody(request);

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

export async function POST(request: Request) {
  return handleNotifyScan(request);
}

export async function GET(request: Request) {
  return handleNotifyScan(request);
}
