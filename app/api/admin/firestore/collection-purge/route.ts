import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { SUPER_ADMIN_PURGE_MAX_DOCS_PER_CALL } from "@/lib/office-requests/export-limits";
import { locales } from "@/lib/i18n/config";
import { getAdminSession, assertSuperAdmin } from "@/lib/office-requests/session";
import {
  isSuperAdminPurgeOperationId,
  SUPER_ADMIN_PURGE_CONFIRM_PHRASE,
} from "@/lib/office-requests/super-admin-data-constants";
import {
  purgeFirestoreCollectionBatched,
  purgeRequestsByTypeBatched,
} from "@/lib/office-requests/super-admin-firestore-data";

type BodyShape = {
  operation?: string;
  confirm?: string;
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

  const operation = String(body.operation ?? "").trim();
  if (!isSuperAdminPurgeOperationId(operation)) {
    return NextResponse.json(
      { error: "نوع العملية غير صالح." },
      { status: 400 },
    );
  }

  const expected = SUPER_ADMIN_PURGE_CONFIRM_PHRASE[operation];
  const confirm = String(body.confirm ?? "").trim();
  if (confirm !== expected) {
    return NextResponse.json(
      {
        error:
          "انسخ جملة التأكيد المعروضة أعلاه حرفياً في الحقل ثم أعد المحاولة.",
      },
      { status: 400 },
    );
  }

  try {
    let deleted = 0;
    let truncated = false;

    switch (operation) {
      case "activity_log": {
        const r = await purgeFirestoreCollectionBatched({
          collectionKey: "activityLogs",
          maxDeleted: SUPER_ADMIN_PURGE_MAX_DOCS_PER_CALL,
        });
        deleted = r.deleted;
        truncated = r.truncated;
        break;
      }
      case "requests_all": {
        const r = await purgeFirestoreCollectionBatched({
          collectionKey: "requests",
          maxDeleted: SUPER_ADMIN_PURGE_MAX_DOCS_PER_CALL,
        });
        deleted = r.deleted;
        truncated = r.truncated;
        break;
      }
      case "requests_complaints": {
        const r = await purgeRequestsByTypeBatched({
          requestType: "complaint",
          maxDeleted: SUPER_ADMIN_PURGE_MAX_DOCS_PER_CALL,
        });
        deleted = r.deleted;
        truncated = r.truncated;
        break;
      }
      case "requests_proposals": {
        const r = await purgeRequestsByTypeBatched({
          requestType: "proposal",
          maxDeleted: SUPER_ADMIN_PURGE_MAX_DOCS_PER_CALL,
        });
        deleted = r.deleted;
        truncated = r.truncated;
        break;
      }
      default:
        return NextResponse.json(
          { error: "نوع العملية غير معروف." },
          { status: 400 },
        );
    }

    for (const locale of locales) {
      revalidatePath(`/${locale}/admin`, "layout");
    }
    return NextResponse.json({
      deleted,
      truncated,
      maxPerCall: SUPER_ADMIN_PURGE_MAX_DOCS_PER_CALL,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل التفريغ.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
