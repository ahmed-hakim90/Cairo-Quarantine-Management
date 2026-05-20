import { exportVaccinesXlsx } from "@/lib/office-requests/vaccines-excel";
import {
  assertCatalogExcelAdmin,
  xlsxResponse,
} from "@/lib/office-requests/catalog-excel-admin";
import { listVaccinesForAdmin } from "@/lib/office-requests/store";

export async function GET(request: Request) {
  const auth = await assertCatalogExcelAdmin(request);
  if (!auth.ok) return auth.response;

  const vaccines = await listVaccinesForAdmin({ includeInactive: true });
  const buffer = await exportVaccinesXlsx(vaccines);
  return xlsxResponse(buffer, "vaccines-export.xlsx");
}
