import { exportTemplatesXlsx } from "@/lib/office-requests/templates-excel";
import {
  assertCatalogExcelAdmin,
  xlsxResponse,
} from "@/lib/office-requests/catalog-excel-admin";
import { listMessageTemplates } from "@/lib/office-requests/store";

export async function GET(request: Request) {
  const auth = await assertCatalogExcelAdmin(request);
  if (!auth.ok) return auth.response;

  const templates = await listMessageTemplates();
  const buffer = await exportTemplatesXlsx(templates);
  return xlsxResponse(buffer, "templates-export.xlsx");
}
