import { decodeCatalogExcelFileBase64 } from "@/lib/office-requests/catalog-excel-io";
import {
  assertSuperAdmin,
  getAdminSession,
} from "@/lib/office-requests/session";
import {
  noStoreJson,
  rejectOversizedRequest,
  rejectUnsafeAdminRequest,
} from "@/lib/security/admin-request";

export type CatalogExcelEntity = "offices" | "vaccines" | "templates";

export async function assertCatalogExcelAdmin(
  request: Request,
): Promise<
  | { ok: true; uid: string; label: string }
  | { ok: false; response: Response }
> {
  const unsafe = rejectUnsafeAdminRequest(request);
  if (unsafe) return { ok: false, response: unsafe };
  const oversized = rejectOversizedRequest(request, 2 * 1024 * 1024);
  if (oversized) return { ok: false, response: oversized };

  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      response: noStoreJson({ error: "غير مصرح." }, { status: 401 }),
    };
  }
  if (!session.profile.active) {
    return {
      ok: false,
      response: noStoreJson({ error: "الحساب موقوف." }, { status: 403 }),
    };
  }
  try {
    assertSuperAdmin(session);
  } catch {
    return {
      ok: false,
      response: noStoreJson({ error: "غير مصرح." }, { status: 403 }),
    };
  }

  return {
    ok: true,
    uid: session.uid,
    label:
      session.profile.displayName || session.email || session.uid,
  };
}

export async function readCatalogExcelBody(
  request: Request,
): Promise<
  | { ok: true; buffer: Buffer }
  | { ok: false; response: Response }
> {
  let body: { fileBase64?: string };
  try {
    body = (await request.json()) as { fileBase64?: string };
  } catch {
    return {
      ok: false,
      response: noStoreJson({ error: "جسم الطلب غير صالح." }, { status: 400 }),
    };
  }

  const fileBase64 = body.fileBase64?.trim();
  if (!fileBase64) {
    return {
      ok: false,
      response: noStoreJson({ error: "لم يُرفَع ملف." }, { status: 400 }),
    };
  }

  try {
    const buffer = decodeCatalogExcelFileBase64(fileBase64);
    if (buffer.length === 0) {
      return {
        ok: false,
        response: noStoreJson({ error: "الملف فارغ." }, { status: 400 }),
      };
    }
    return { ok: true, buffer };
  } catch {
    return {
      ok: false,
      response: noStoreJson({ error: "تعذّر قراءة الملف." }, { status: 400 }),
    };
  }
}

export function xlsxResponse(buffer: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
