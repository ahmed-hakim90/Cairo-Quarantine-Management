import { exportOfficesXlsx } from "@/lib/office-requests/offices-excel";
import {
  assertCatalogExcelAdmin,
  xlsxResponse,
} from "@/lib/office-requests/catalog-excel-admin";
import { listOffices } from "@/lib/office-requests/store";

export async function GET(request: Request) {
  const auth = await assertCatalogExcelAdmin(request);
  if (!auth.ok) return auth.response;

  const offices = await listOffices({ includeInactive: true });
  const buffer = await exportOfficesXlsx(offices);
  return xlsxResponse(buffer, "offices-export.xlsx");
}
