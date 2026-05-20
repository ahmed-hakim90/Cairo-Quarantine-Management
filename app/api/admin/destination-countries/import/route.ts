import { revalidatePath, revalidateTag } from "next/cache";
import { locales } from "@/lib/i18n/config";
import {
  mergeImportParseErrors,
  parseDestinationCountriesWorkbook,
} from "@/lib/office-requests/destination-countries-import";
import {
  countDestinationCountries,
  importDestinationCountries,
  OFFICE_REQUESTS_CACHE_TAGS,
} from "@/lib/office-requests/store";
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

function decodeBase64File(payload: string): Buffer {
  const trimmed = payload.trim();
  const base64 = trimmed.includes(",")
    ? (trimmed.split(",").pop() ?? trimmed)
    : trimmed;
  return Buffer.from(base64, "base64");
}

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
    buffer = decodeBase64File(fileBase64);
  } catch {
    return noStoreJson({ error: "تعذّر قراءة الملف." }, { status: 400 });
  }

  if (buffer.length === 0) {
    return noStoreJson({ error: "الملف فارغ." }, { status: 400 });
  }

  const { rows, errors: parseErrors } =
    await parseDestinationCountriesWorkbook(buffer);

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

  const existingCount = await countDestinationCountries();
  const mode = existingCount === 0 ? "bootstrap" : "update";

  try {
    const result = await importDestinationCountries(
      rows,
      mode,
      {
        uid: session.uid,
        label: session.profile.displayName || session.email || session.uid,
      },
    );

    const merged = mergeImportParseErrors(parseErrors, result);

    revalidateTag(
      OFFICE_REQUESTS_CACHE_TAGS.publicDestinationCountries,
      "max",
    );
    for (const locale of locales) {
      revalidatePath(`/${locale}/international-traveler`);
      revalidatePath(`/${locale}/admin/destination-countries`);
    }

    return noStoreJson({ mode, ...merged });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "فشل استيراد الملف.";
    return noStoreJson({ error: message }, { status: 500 });
  }
}
