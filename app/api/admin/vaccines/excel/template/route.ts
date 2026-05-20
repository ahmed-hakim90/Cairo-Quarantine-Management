import { buildVaccinesTemplateXlsx } from "@/lib/office-requests/vaccines-excel";
import {
  assertCatalogExcelAdmin,
  xlsxResponse,
} from "@/lib/office-requests/catalog-excel-admin";

export async function GET(request: Request) {
  const auth = await assertCatalogExcelAdmin(request);
  if (!auth.ok) return auth.response;

  const buffer = await buildVaccinesTemplateXlsx();
  return xlsxResponse(buffer, "vaccines-template.xlsx");
}
