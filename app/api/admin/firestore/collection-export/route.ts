import { NextResponse } from "next/server";
import {
  SUPER_ADMIN_EXPORT_MAX_ROWS,
} from "@/lib/office-requests/export-limits";
import { getAdminSession, assertSuperAdmin } from "@/lib/office-requests/session";
import {
  EXPORT_FILE_STEM_AR,
  isSuperAdminDataCollectionKey,
} from "@/lib/office-requests/super-admin-data-constants";
import {
  buildNdjsonExportForCollection,
} from "@/lib/office-requests/super-admin-firestore-data";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const collection = searchParams.get("collection")?.trim() ?? "";
  if (!isSuperAdminDataCollectionKey(collection)) {
    return NextResponse.json(
      { error: "نوع البيانات المختار غير مسموح للتصدير." },
      { status: 400 },
    );
  }

  const limitRaw = searchParams.get("limit");
  const limitParsed = limitRaw ? Number.parseInt(limitRaw, 10) : NaN;
  const maxDocs = Number.isFinite(limitParsed)
    ? limitParsed
    : SUPER_ADMIN_EXPORT_MAX_ROWS;

  try {
    const { ndjson, docCount, capped } = await buildNdjsonExportForCollection({
      collectionKey: collection,
      maxDocs,
    });
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `${EXPORT_FILE_STEM_AR[collection]}-${dateStamp}.txt`;
    const headers = new Headers();
    headers.set("Content-Type", "application/x-ndjson; charset=utf-8");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    headers.set("X-Export-Doc-Count", String(docCount));
    if (capped) {
      headers.set("X-Export-Capped", "true");
      headers.set("X-Export-Max-Rows", String(SUPER_ADMIN_EXPORT_MAX_ROWS));
    }
    return new NextResponse(ndjson, { status: 200, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل التصدير.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
