import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { SUPER_ADMIN_IMPORT_MAX_DOCS } from "@/lib/office-requests/export-limits";
import { locales } from "@/lib/i18n/config";
import { getAdminSession, assertSuperAdmin } from "@/lib/office-requests/session";
import { OFFICE_REQUESTS_CACHE_TAGS } from "@/lib/office-requests/store";
import { isSuperAdminDataCollectionKey } from "@/lib/office-requests/super-admin-data-constants";
import {
  importDocumentsToCollection,
  parseJsonArrayImportPayload,
  parseNdjsonImportPayload,
} from "@/lib/office-requests/super-admin-firestore-data";

type BodyShape = {
  collection?: string;
  format?: "ndjson" | "json";
  payload?: string;
};

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }
  if (!session.profile.active) {
    return NextResponse.json({ error: "الحساب موقوف." }, { status: 403 });
  }
  try {
    assertSuperAdmin(session);
  } catch {
    return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  }

  let body: BodyShape;
  try {
    body = (await request.json()) as BodyShape;
  } catch {
    return NextResponse.json(
      { error: "تعذّر قراءة الطلب. أعد المحاولة." },
      { status: 400 },
    );
  }

  const collection = String(body.collection ?? "").trim();
  if (!isSuperAdminDataCollectionKey(collection)) {
    return NextResponse.json(
      { error: "نوع البيانات المختار غير مسموح للاستيراد." },
      { status: 400 },
    );
  }

  const format = body.format === "json" ? "json" : "ndjson";
  const payload = String(body.payload ?? "");
  if (!payload.trim()) {
    return NextResponse.json(
      { error: "لم يُرسل أي نص للاستيراد." },
      { status: 400 },
    );
  }

  const parsed =
    format === "json"
      ? parseJsonArrayImportPayload(payload)
      : parseNdjsonImportPayload(payload);

  const combinedErrors = [...parsed.parseErrors];
  let items = parsed.items;
  if (items.length > SUPER_ADMIN_IMPORT_MAX_DOCS) {
    combinedErrors.push(
      `تم اقتصار الاستيراد إلى أول ${SUPER_ADMIN_IMPORT_MAX_DOCS} وثيقة.`,
    );
    items = items.slice(0, SUPER_ADMIN_IMPORT_MAX_DOCS);
  }

  try {
    const { written, errors } = await importDocumentsToCollection({
      collectionKey: collection,
      items,
    });
    for (const locale of locales) {
      revalidatePath(`/${locale}/admin`, "layout");
    }
    for (const tag of Object.values(OFFICE_REQUESTS_CACHE_TAGS)) {
      revalidateTag(tag, "max");
    }
    return NextResponse.json({
      written,
      errors: [...combinedErrors, ...errors],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل الاستيراد.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
