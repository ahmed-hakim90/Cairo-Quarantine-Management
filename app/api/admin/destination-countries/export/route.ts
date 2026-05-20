import { buildDestinationCountriesExportXlsx } from "@/lib/office-requests/destination-countries-import";
import {
  assertSuperAdmin,
  getAdminSession,
} from "@/lib/office-requests/session";
import { listDestinationCountriesForAdmin } from "@/lib/office-requests/store";
import { rejectUnsafeAdminRequest } from "@/lib/security/admin-request";

export async function GET(request: Request) {
  const unsafe = rejectUnsafeAdminRequest(request);
  if (unsafe) return unsafe;

  const session = await getAdminSession();
  if (!session) {
    return new Response("غير مصرح.", { status: 401 });
  }
  if (!session.profile.active) {
    return new Response("الحساب موقوف.", { status: 403 });
  }
  try {
    assertSuperAdmin(session);
  } catch {
    return new Response("غير مصرح.", { status: 403 });
  }

  const countries = await listDestinationCountriesForAdmin();
  const buffer = await buildDestinationCountriesExportXlsx(countries);
  const dateStamp = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="destination-countries-${dateStamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
