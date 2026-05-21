import { runRetentionMaintenance } from "@/lib/office-requests/retention";
import { authorizeCronRequest } from "@/lib/cron/authorize";
import { noStoreJson } from "@/lib/security/admin-request";

async function handleRetention(request: Request) {
  const denied = authorizeCronRequest(request, "MAINTENANCE_CRON_SECRET");
  if (denied) return denied;

  try {
    const result = await runRetentionMaintenance();
    return noStoreJson(result);
  } catch (e) {
    return noStoreJson(
      { error: e instanceof Error ? e.message : "فشلت صيانة البيانات." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return handleRetention(request);
}

/** Vercel Cron and external schedulers often use GET. */
export async function GET(request: Request) {
  return handleRetention(request);
}
