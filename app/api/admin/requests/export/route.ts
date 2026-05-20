import { NextResponse } from "next/server";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import { parseExportCreatedBounds } from "@/lib/office-requests/export-date-bounds";
import { parseAdminRequestsStatus } from "@/lib/office-requests/requests-list-params";
import { validateYmdRange } from "@/lib/ymd-range";
import { officeRequestsToXlsxBuffer } from "@/lib/office-requests/export-xlsx";
import { SUPER_ADMIN_EXPORT_MAX_ROWS } from "@/lib/office-requests/export-limits";
import {
  adminAllowedOfficeIds,
  adminCanAccessOffice,
} from "@/lib/office-requests/admin-access";
import { mergeTravelerStateLabelsWithLegacy } from "@/lib/office-requests/office-traveler-state";
import {
  listRequestsForSuperAdminExport,
  listTravelerStates,
} from "@/lib/office-requests/store";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  noStoreHeaders,
  noStoreJson,
  rejectUnsafeAdminRequest,
} from "@/lib/security/admin-request";
import type {
  OfficeRequestType,
  TravelerCategory,
} from "@/lib/office-requests/types";

const VALID_TYPES = new Set<OfficeRequestType>([
  "booking",
  "complaint",
  "proposal",
]);
const VALID_TRAVELER = new Set<TravelerCategory>([
  "international",
  "hajj_umrah",
  "citizen",
]);

function parseCommaList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const unsafe = rejectUnsafeAdminRequest(request);
  if (unsafe) return unsafe;

  const session = await getAdminSession();
  if (!session) {
    return noStoreJson({ error: "غير مصرح." }, { status: 401 });
  }

  if (!session.profile.active) {
    return noStoreJson({ error: "الحساب موقوف." }, { status: 403 });
  }

  const role = session.profile.role;
  if (
    role === "office_user" &&
    !session.profile.officeId?.trim()
  ) {
    return noStoreJson(
      { error: "حسابك غير مرتبط بمكتب. تواصل مع الإدارة." },
      { status: 403 },
    );
  }
  if (
    (role === "office_admin" || role === "governorate_admin") &&
    adminAllowedOfficeIds(session.profile).length === 0
  ) {
    return noStoreJson(
      { error: "حسابك غير مرتبط بأي مكاتب. تواصل مع الإدارة." },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);

  const typeTokens = [
    ...parseCommaList(searchParams.get("types")),
    ...searchParams.getAll("type"),
  ];
  const types = (
    typeTokens.length > 0
      ? typeTokens.filter((t): t is OfficeRequestType =>
          VALID_TYPES.has(t as OfficeRequestType),
        )
      : (["booking", "complaint", "proposal"] as OfficeRequestType[])
  ) as OfficeRequestType[];

  const officeRaw = searchParams.get("officeId")?.trim() ?? "";
  const officeIdFromQuery =
    !officeRaw || officeRaw.toLowerCase() === "all" ? null : officeRaw;

  let officeId: string | null = officeIdFromQuery;
  let officeIds: string[] | null = null;
  if (role === "office_user") {
    officeId = session.profile.officeId!.trim();
  } else if (role === "office_admin" || role === "governorate_admin") {
    officeIds = adminAllowedOfficeIds(session.profile);
    if (officeId && !adminCanAccessOffice(session.profile, officeId)) {
      return noStoreJson(
        { error: "المكتب المختار خارج نطاق صلاحياتك." },
        { status: 403 },
      );
    }
  }

  const travelerTokens = [
    ...parseCommaList(searchParams.get("travelerStateIds")),
    ...searchParams.getAll("travelerStateId"),
    ...parseCommaList(searchParams.get("travelerCategories")),
    ...searchParams.getAll("travelerCategory"),
  ];
  const includeUncategorized = travelerTokens.some(
    (t) => t.toLowerCase() === "uncategorized",
  );
  const travelerStateIds = travelerTokens
    .filter((t) => t.toLowerCase() !== "uncategorized")
    .filter((t) => !VALID_TRAVELER.has(t as TravelerCategory));
  const travelerCategories = travelerTokens
    .filter((t) => t.toLowerCase() !== "uncategorized")
    .filter((t): t is TravelerCategory =>
      VALID_TRAVELER.has(t as TravelerCategory),
    ) as TravelerCategory[];

  const bounds = parseExportCreatedBounds(
    searchParams.get("from"),
    searchParams.get("to"),
  );
  if ("error" in bounds) {
    return noStoreJson({ error: bounds.error }, { status: 400 });
  }

  const statusFilter = parseAdminRequestsStatus(searchParams.get("status"));
  const exportStatus =
    statusFilter === "all" ? null : statusFilter;

  const bookingBounds = validateYmdRange(
    searchParams.get("bookingFrom") ?? searchParams.get("bookingDateFrom"),
    searchParams.get("bookingTo") ?? searchParams.get("bookingDateTo"),
  );
  if (bookingBounds && "error" in bookingBounds) {
    return noStoreJson({ error: bookingBounds.error }, { status: 400 });
  }

  if (!isFirebaseAdminConfigured()) {
    return noStoreJson(
      {
        error:
          "إعدادات Firebase على الخادم غير مكتملة. راجع متغيرات FIREBASE_* في البيئة.",
      },
      { status: 503 },
    );
  }

  try {
    const { requests, capped } = await listRequestsForSuperAdminExport({
      types,
      officeId,
      officeIds,
      travelerStateIds,
      travelerCategories,
      includeUncategorizedBookings: includeUncategorized,
      createdFrom: bounds.createdFrom,
      createdTo: bounds.createdTo,
      status: exportStatus,
      bookingDateFrom: bookingBounds?.fromYmd ?? null,
      bookingDateTo: bookingBounds?.toYmd ?? null,
      adminBookingTodayYmd: getCairoTodayYmd(),
    });

    const stateLabels = mergeTravelerStateLabelsWithLegacy(
      await listTravelerStates({ includeInactive: true }),
    );
    const buffer = await officeRequestsToXlsxBuffer(requests, stateLabels);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `requests-${dateStamp}.xlsx`;

    const headers = noStoreHeaders();
    headers.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    headers.set("X-Export-Row-Count", String(requests.length));
    if (capped) {
      headers.set("X-Export-Capped", "true");
      headers.set("X-Export-Max-Rows", String(SUPER_ADMIN_EXPORT_MAX_ROWS));
    }

    return new NextResponse(new Uint8Array(buffer), { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[admin/requests/export]", message);

    const needsIndex =
      message.includes("FAILED_PRECONDITION") ||
      message.includes("requires an index");

    return noStoreJson(
      {
        error: needsIndex
          ? "فهرس Firestore مطلوب لهذا التصدير. انشر firestore.indexes.json ثم أعد المحاولة."
          : "تعذّر جلب الطلبات من قاعدة البيانات. حاول لاحقاً أو ضيّق التصفية.",
      },
      { status: 500 },
    );
  }
}
