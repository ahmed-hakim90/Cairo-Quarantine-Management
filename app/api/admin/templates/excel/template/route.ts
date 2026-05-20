import { buildTemplatesTemplateXlsx } from "@/lib/office-requests/templates-excel";
import {
  assertCatalogExcelAdmin,
  xlsxResponse,
} from "@/lib/office-requests/catalog-excel-admin";

export async function GET(request: Request) {
  const auth = await assertCatalogExcelAdmin(request);
  if (!auth.ok) return auth.response;

  const buffer = await buildTemplatesTemplateXlsx();
  return xlsxResponse(buffer, "templates-template.xlsx");
}
