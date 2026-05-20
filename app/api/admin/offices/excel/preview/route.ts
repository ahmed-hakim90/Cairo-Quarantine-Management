import {
  buildOfficesImportPreview,
  parseOfficesWorkbook,
} from "@/lib/office-requests/offices-excel";
import {
  assertCatalogExcelAdmin,
  readCatalogExcelBody,
} from "@/lib/office-requests/catalog-excel-admin";
import { listOffices } from "@/lib/office-requests/store";
import { noStoreJson } from "@/lib/security/admin-request";

export async function POST(request: Request) {
  const auth = await assertCatalogExcelAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await readCatalogExcelBody(request);
  if (!body.ok) return body.response;

  const { rows, errors: parseErrors } = await parseOfficesWorkbook(body.buffer);
  const existing = await listOffices({ includeInactive: true });
  const preview = buildOfficesImportPreview(rows, existing, parseErrors);

  if (rows.length === 0) {
    return noStoreJson(
      { error: "لا توجد صفوف صالحة للمعاينة.", preview },
      { status: 400 },
    );
  }

  return noStoreJson({ preview });
}
