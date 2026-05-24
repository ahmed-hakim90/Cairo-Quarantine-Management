import { probeFirestoreHealth } from "@/lib/analytics/public-analytics-store";
import { getAdminSession } from "@/lib/office-requests/session";
import { noStoreJson } from "@/lib/security/admin-request";

export async function GET() {
  const session = await getAdminSession();
  if (!session || session.profile.role !== "super_admin") {
    return noStoreJson({ error: "unauthorized" }, { status: 401 });
  }

  const health = await probeFirestoreHealth();
  const ok = health.configured && health.readOk && health.writeOk;

  return noStoreJson({
    ok,
    ...health,
    checkedAt: new Date().toISOString(),
  });
}
