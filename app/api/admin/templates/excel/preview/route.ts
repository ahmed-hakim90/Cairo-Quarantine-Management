import {
  buildTemplatesImportPreview,
  parseTemplatesWorkbook,
} from "@/lib/office-requests/templates-excel";
import {
  assertCatalogExcelAdmin,
  readCatalogExcelBody,
} from "@/lib/office-requests/catalog-excel-admin";
import { listMessageTemplates } from "@/lib/office-requests/store";
import { noStoreJson } from "@/lib/security/admin-request";

export async function POST(request: Request) {
  const auth = await assertCatalogExcelAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await readCatalogExcelBody(request);
  if (!body.ok) return body.response;

  const { rows, errors: parseErrors } =
    await parseTemplatesWorkbook(body.buffer);
  const existing = await listMessageTemplates();
  const preview = buildTemplatesImportPreview(rows, existing, parseErrors);

  if (rows.length === 0) {
    return noStoreJson(
      { error: "لا توجد صفوف صالحة للمعاينة.", preview },
      { status: 400 },
    );
  }

  return noStoreJson({ preview });
}
