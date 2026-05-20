import { revalidatePath, revalidateTag } from "next/cache";
import { locales } from "@/lib/i18n/config";
import { mergeImportParseErrors } from "@/lib/office-requests/destination-countries-import";
import { parseOfficesWorkbook } from "@/lib/office-requests/offices-excel";
import {
  assertCatalogExcelAdmin,
  readCatalogExcelBody,
} from "@/lib/office-requests/catalog-excel-admin";
import {
  countOfficesInFirestore,
  importOfficesFromExcel,
  OFFICE_REQUESTS_CACHE_TAGS,
} from "@/lib/office-requests/store";
import { noStoreJson } from "@/lib/security/admin-request";

export async function POST(request: Request) {
  const auth = await assertCatalogExcelAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await readCatalogExcelBody(request);
  if (!body.ok) return body.response;

  const { rows, errors: parseErrors } = await parseOfficesWorkbook(body.buffer);
  if (rows.length === 0) {
    return noStoreJson(
      mergeImportParseErrors(parseErrors, {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: ["لا توجد صفوف صالحة للاستيراد."],
      }),
      { status: 400 },
    );
  }

  const mode =
    (await countOfficesInFirestore()) === 0 ? "bootstrap" : "update";

  try {
    const result = await importOfficesFromExcel(rows, mode, {
      uid: auth.uid,
      label: auth.label,
    });
    const merged = mergeImportParseErrors(parseErrors, result);

    revalidateTag(OFFICE_REQUESTS_CACHE_TAGS.publicOffices, "max");
    for (const locale of locales) {
      revalidatePath(`/${locale}/admin/offices`);
    }

    return noStoreJson({ mode, ...merged });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "فشل استيراد الملف.";
    return noStoreJson({ error: message }, { status: 500 });
  }
}
