import { buildOfficesTemplateXlsx } from "@/lib/office-requests/offices-excel";
import {
  assertCatalogExcelAdmin,
  xlsxResponse,
} from "@/lib/office-requests/catalog-excel-admin";

export async function GET(request: Request) {
  const auth = await assertCatalogExcelAdmin(request);
  if (!auth.ok) return auth.response;

  const buffer = await buildOfficesTemplateXlsx();
  return xlsxResponse(buffer, "offices-template.xlsx");
}
