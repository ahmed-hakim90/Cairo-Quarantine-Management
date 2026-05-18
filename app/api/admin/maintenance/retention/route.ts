import { runRetentionMaintenance } from "@/lib/office-requests/retention";
import { bearerToken, safeTokenEquals } from "@/lib/security/bearer-token";
import { noStoreJson } from "@/lib/security/admin-request";

export async function POST(request: Request) {
  const expected = process.env.MAINTENANCE_CRON_SECRET?.trim();
  if (!expected) {
    return noStoreJson(
      { error: "MAINTENANCE_CRON_SECRET غير مضبوط." },
      { status: 500 },
    );
  }
  if (!safeTokenEquals(bearerToken(request), expected)) {
    return noStoreJson({ error: "غير مصرح." }, { status: 401 });
  }

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
