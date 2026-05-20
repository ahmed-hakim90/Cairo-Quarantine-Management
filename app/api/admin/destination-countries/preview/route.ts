import { decodeCatalogExcelFileBase64 } from "@/lib/office-requests/catalog-excel-io";
import {
  buildDestinationCountriesImportPreview,
  parseDestinationCountriesWorkbook,
} from "@/lib/office-requests/destination-countries-import";
import { listDestinationCountriesForAdmin } from "@/lib/office-requests/store";
import {
  assertSuperAdmin,
  getAdminSession,
} from "@/lib/office-requests/session";
import {
  noStoreJson,
  rejectOversizedRequest,
  rejectUnsafeAdminRequest,
} from "@/lib/security/admin-request";

type BodyShape = {
  fileBase64?: string;
};

export async function POST(request: Request) {
  const unsafe = rejectUnsafeAdminRequest(request);
  if (unsafe) return unsafe;
  const oversized = rejectOversizedRequest(request, 2 * 1024 * 1024);
  if (oversized) return oversized;

  const session = await getAdminSession();
  if (!session) {
    return noStoreJson({ error: "غير مصرح." }, { status: 401 });
  }
  if (!session.profile.active) {
    return noStoreJson({ error: "الحساب موقوف." }, { status: 403 });
  }
  try {
    assertSuperAdmin(session);
  } catch {
    return noStoreJson({ error: "غير مصرح." }, { status: 403 });
  }

  let body: BodyShape;
  try {
    body = (await request.json()) as BodyShape;
  } catch {
    return noStoreJson({ error: "جسم الطلب غير صالح." }, { status: 400 });
  }

  const fileBase64 = body.fileBase64?.trim();
  if (!fileBase64) {
    return noStoreJson({ error: "لم يُرفَع ملف." }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = decodeCatalogExcelFileBase64(fileBase64);
  } catch {
    return noStoreJson({ error: "تعذّر قراءة الملف." }, { status: 400 });
  }

  if (buffer.length === 0) {
    return noStoreJson({ error: "الملف فارغ." }, { status: 400 });
  }

  const { rows, errors: parseErrors } =
    await parseDestinationCountriesWorkbook(buffer);

  const existing = await listDestinationCountriesForAdmin();
  const preview = buildDestinationCountriesImportPreview(
    rows,
    existing,
    parseErrors,
  );

  if (rows.length === 0 && preview.errors.length === 0) {
    return noStoreJson(
      { error: "لا توجد صفوف صالحة للمعاينة.", preview },
      { status: 400 },
    );
  }

  return noStoreJson({ preview });
}
