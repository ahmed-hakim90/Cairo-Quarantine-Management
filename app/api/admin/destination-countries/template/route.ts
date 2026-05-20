import { buildDestinationCountriesTemplateXlsx } from "@/lib/office-requests/destination-countries-import";
import {
  assertSuperAdmin,
  getAdminSession,
} from "@/lib/office-requests/session";
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

  const buffer = await buildDestinationCountriesTemplateXlsx();

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="destination-countries-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
