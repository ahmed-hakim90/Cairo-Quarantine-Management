import { NextResponse } from "next/server";
import { parseExportCreatedBounds } from "@/lib/office-requests/export-date-bounds";
import { officeRequestsToXlsxBuffer } from "@/lib/office-requests/export-xlsx";
import { SUPER_ADMIN_EXPORT_MAX_ROWS } from "@/lib/office-requests/export-limits";
import { mergeTravelerStateLabelsWithLegacy } from "@/lib/office-requests/office-traveler-state";
import {
  listRequestsForSuperAdminExport,
  listTravelerStates,
} from "@/lib/office-requests/store";
import { getAdminSession } from "@/lib/office-requests/session";
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
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  if (!session.profile.active) {
    return NextResponse.json({ error: "الحساب موقوف." }, { status: 403 });
  }

  const role = session.profile.role;
  if (role === "office_user" && !session.profile.officeId?.trim()) {
    return NextResponse.json(
      { error: "حسابك غير مرتبط بمكتب. تواصل مع الإدارة." },
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

  const officeId =
    role === "office_user"
      ? session.profile.officeId!.trim()
      : officeIdFromQuery;

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
    return NextResponse.json({ error: bounds.error }, { status: 400 });
  }

  const { requests, capped } = await listRequestsForSuperAdminExport({
    types,
    officeId,
    travelerStateIds,
    travelerCategories,
    includeUncategorizedBookings: includeUncategorized,
    createdFrom: bounds.createdFrom,
    createdTo: bounds.createdTo,
  });

  const stateLabels = mergeTravelerStateLabelsWithLegacy(
    await listTravelerStates({ includeInactive: true }),
  );
  const buffer = officeRequestsToXlsxBuffer(requests, stateLabels);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `requests-${dateStamp}.xlsx`;

  const headers = new Headers();
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
}
