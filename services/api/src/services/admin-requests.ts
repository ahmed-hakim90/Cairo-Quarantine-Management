import { getPool } from "@cqm/shared";
import { ApiError } from "../lib/errors.js";
import {
  adminCanAccessOffice,
  normalizeOfficeIds,
  phoneLookupVariants,
  requestNumberLookupVariants,
  type AdminRole,
  type OfficeRequest,
  type OfficeRequestStatus,
  type OfficeRequestType,
  REQUEST_STATUS_LABELS,
} from "../lib/domain.js";
import { isAdminVisibleBookingRequest } from "../lib/booking-visibility.js";
import { appendActivityLog } from "../lib/activity-log.js";
import { requestFromRow } from "../lib/db-mappers.js";

export type AdminRequestsSort =
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "updated_asc";

const VALID_STATUSES: OfficeRequestStatus[] = [
  "new",
  "in_progress",
  "contacted",
  "completed",
  "cancelled",
];
const VALID_TYPES: OfficeRequestType[] = ["booking", "complaint", "proposal"];

export type AdminScope = {
  role: AdminRole;
  officeId: string | null;
  allowedOfficeIds?: string[];
};

function decodeCursor(cursor?: string | null): Date | null {
  if (!cursor?.trim()) return null;
  try {
    const decoded = Buffer.from(cursor.trim(), "base64url").toString("utf8");
    const date = new Date(decoded);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function encodeCursor(iso: string): string {
  return Buffer.from(iso, "utf8").toString("base64url");
}

const VALID_SORTS = new Set<AdminRequestsSort>([
  "created_desc",
  "created_asc",
  "updated_desc",
  "updated_asc",
]);

export function parseAdminRequestsSort(value: unknown): AdminRequestsSort {
  const raw = String(value ?? "").trim();
  if (raw && VALID_SORTS.has(raw as AdminRequestsSort)) {
    return raw as AdminRequestsSort;
  }
  return "created_desc";
}

function sortToSql(sort: AdminRequestsSort): {
  column: "created_at" | "updated_at";
  direction: "ASC" | "DESC";
  cursorOp: "<" | ">";
} {
  switch (sort) {
    case "created_asc":
      return { column: "created_at", direction: "ASC", cursorOp: ">" };
    case "updated_desc":
      return { column: "updated_at", direction: "DESC", cursorOp: "<" };
    case "updated_asc":
      return { column: "updated_at", direction: "ASC", cursorOp: ">" };
    case "created_desc":
    default:
      return { column: "created_at", direction: "DESC", cursorOp: "<" };
  }
}

function coerceSortForUpdatedWindow(
  sort: AdminRequestsSort,
  hasUpdatedWindow: boolean,
): AdminRequestsSort {
  if (!hasUpdatedWindow) return sort;
  switch (sort) {
    case "created_asc":
      return "updated_asc";
    case "created_desc":
      return "updated_desc";
    default:
      return sort;
  }
}

export function parseIsoDateParam(value: unknown): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function adminOfficeScope(scope: AdminScope, officeFilter?: string): string[] | null {
  if (scope.role === "office_user") {
    return scope.officeId ? [scope.officeId] : [];
  }
  if (scope.role === "office_admin" || scope.role === "governorate_admin") {
    if (officeFilter?.trim()) {
      return adminCanAccessOffice(scope, officeFilter)
        ? [officeFilter.trim()]
        : [];
    }
    return normalizeOfficeIds(scope.allowedOfficeIds ?? []);
  }
  return officeFilter?.trim() ? [officeFilter.trim()] : null;
}

export async function listAdminRequests(args: {
  databaseUrl: string;
  scope: AdminScope;
  status?: OfficeRequestStatus | "all";
  type?: OfficeRequestType | "all";
  officeFilter?: string;
  limit?: number;
  cursor?: string | null;
  q?: string;
  sort?: AdminRequestsSort;
  updatedFrom?: Date | null;
  updatedTo?: Date | null;
  adminBookingTodayYmd?: string | null;
  bookingDateFrom?: string | null;
  bookingDateTo?: string | null;
}): Promise<{ items: OfficeRequest[]; nextCursor: string | null }> {
  const pool = getPool(args.databaseUrl);
  const pageSize = Math.min(Math.max(1, args.limit ?? 100), 200);
  const officeIds = adminOfficeScope(args.scope, args.officeFilter);
  if (officeIds && officeIds.length === 0) {
    return { items: [], nextCursor: null };
  }

  const q = args.q?.trim();
  if (q) {
    return searchAdminRequests({
      ...args,
      q,
      pageSize,
      officeIds,
      adminBookingTodayYmd: args.adminBookingTodayYmd,
      bookingDateFrom: args.bookingDateFrom,
      bookingDateTo: args.bookingDateTo,
    });
  }

  const updatedFrom = args.updatedFrom ?? null;
  const updatedTo = args.updatedTo ?? null;
  const useUpdatedWindow =
    updatedFrom != null &&
    updatedTo != null &&
    updatedFrom.getTime() <= updatedTo.getTime();
  const sort = coerceSortForUpdatedWindow(
    parseAdminRequestsSort(args.sort),
    useUpdatedWindow,
  );
  const { column, direction, cursorOp } = sortToSql(sort);
  const hasBookingFilter = Boolean(args.adminBookingTodayYmd);
  const fetchLimit = hasBookingFilter
    ? Math.min(200, Math.max(pageSize + 1, pageSize * 4))
    : pageSize + 1;

  const cursorDate = decodeCursor(args.cursor);
  const params: unknown[] = [];
  let paramIndex = 1;
  const conditions: string[] = [];

  if (officeIds) {
    conditions.push(`office_id = ANY($${paramIndex}::text[])`);
    params.push(officeIds);
    paramIndex += 1;
  }
  if (args.status && args.status !== "all") {
    conditions.push(`status = $${paramIndex}`);
    params.push(args.status);
    paramIndex += 1;
  }
  if (args.type && args.type !== "all") {
    conditions.push(`type = $${paramIndex}`);
    params.push(args.type);
    paramIndex += 1;
  }
  if (useUpdatedWindow) {
    conditions.push(`updated_at >= $${paramIndex}`);
    params.push(updatedFrom);
    paramIndex += 1;
    conditions.push(`updated_at <= $${paramIndex}`);
    params.push(updatedTo);
    paramIndex += 1;
  }
  if (cursorDate) {
    conditions.push(`${column} ${cursorOp} $${paramIndex}`);
    params.push(cursorDate);
    paramIndex += 1;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(fetchLimit);

  const sql = `SELECT * FROM requests ${where}
    ORDER BY ${column} ${direction}
    LIMIT $${paramIndex}`;

  const result = await pool.query(sql, params);
  let rows = result.rows.map((row) => requestFromRow(row as never));

  if (hasBookingFilter) {
    rows = rows.filter((request) =>
      isAdminVisibleBookingRequest(request, {
        todayYmd: args.adminBookingTodayYmd!,
        bookingDateFrom: args.bookingDateFrom,
        bookingDateTo: args.bookingDateTo,
      }),
    );
  }

  const items = rows.slice(0, pageSize);
  const sortKey = column === "updated_at" ? "updatedAt" : "createdAt";
  const nextCursor =
    rows.length > pageSize
      ? encodeCursor(items[items.length - 1]![sortKey])
      : null;

  return { items, nextCursor };
}

async function searchAdminRequests(args: {
  databaseUrl: string;
  scope: AdminScope;
  status?: OfficeRequestStatus | "all";
  type?: OfficeRequestType | "all";
  officeIds: string[] | null;
  q: string;
  pageSize: number;
  adminBookingTodayYmd?: string | null;
  bookingDateFrom?: string | null;
  bookingDateTo?: string | null;
}): Promise<{ items: OfficeRequest[]; nextCursor: string | null }> {
  const pool = getPool(args.databaseUrl);
  const byId = new Map<string, OfficeRequest>();

  const addIfVisible = (request: OfficeRequest) => {
    if (args.officeIds && !args.officeIds.includes(request.officeId)) return;
    if (args.status && args.status !== "all" && request.status !== args.status) {
      return;
    }
    if (args.type && args.type !== "all" && request.type !== args.type) {
      return;
    }
    if (
      args.adminBookingTodayYmd &&
      !isAdminVisibleBookingRequest(request, {
        todayYmd: args.adminBookingTodayYmd,
        bookingDateFrom: args.bookingDateFrom,
        bookingDateTo: args.bookingDateTo,
      })
    ) {
      return;
    }
    if (!requestMatchesSearch(request, args.q)) return;
    byId.set(request.id, request);
  };

  const direct = await pool.query(`SELECT * FROM requests WHERE id = $1`, [args.q]);
  if (direct.rowCount) {
    addIfVisible(requestFromRow(direct.rows[0] as never));
  }

  const exactLookups = [
    ...requestNumberLookupVariants(args.q).map((value) => ({
      field: "request_number",
      value,
    })),
    ...phoneLookupVariants(args.q).map((value) => ({ field: "phone", value })),
  ];

  for (const lookup of exactLookups) {
    let sql = `SELECT * FROM requests WHERE ${lookup.field} = $1`;
    const params: unknown[] = [lookup.value];
    if (args.officeIds) {
      sql += ` AND office_id = ANY($2::text[])`;
      params.push(args.officeIds);
    }
    sql += ` LIMIT 20`;
    const snap = await pool.query(sql, params);
    for (const row of snap.rows) {
      addIfVisible(requestFromRow(row as never));
    }
  }

  if (byId.size < args.pageSize) {
    const params: unknown[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];
    if (args.officeIds) {
      conditions.push(`office_id = ANY($${paramIndex}::text[])`);
      params.push(args.officeIds);
      paramIndex += 1;
    }
    if (args.status && args.status !== "all") {
      conditions.push(`status = $${paramIndex}`);
      params.push(args.status);
      paramIndex += 1;
    }
    if (args.type && args.type !== "all") {
      conditions.push(`type = $${paramIndex}`);
      params.push(args.type);
      paramIndex += 1;
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(200);
    const snap = await pool.query(
      `SELECT * FROM requests ${where} ORDER BY created_at DESC LIMIT $${paramIndex}`,
      params,
    );
    for (const row of snap.rows) {
      addIfVisible(requestFromRow(row as never));
      if (byId.size >= args.pageSize * 2) break;
    }
  }

  const items = [...byId.values()]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, args.pageSize);

  return { items, nextCursor: null };
}

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("ar-EG")
    .replace(/\s+/g, " ");
}

function requestMatchesSearch(request: OfficeRequest, rawQuery: string): boolean {
  const query = normalizeSearchText(rawQuery);
  if (!query) return true;
  const digits = rawQuery.replace(/\D/g, "");
  const requestNumbers = requestNumberLookupVariants(rawQuery);
  const phoneVariants = phoneLookupVariants(rawQuery);
  const haystack = [request.id, request.requestNumber, request.name, request.phone]
    .map(normalizeSearchText)
    .filter(Boolean);

  if (requestNumbers.includes(request.requestNumber.toUpperCase())) return true;
  if (phoneVariants.includes(request.phone)) return true;
  if (digits && request.phone.replace(/\D/g, "").includes(digits)) return true;
  return haystack.some((item) => item.includes(query));
}

export async function getRequestForAdminScope(args: {
  databaseUrl: string;
  scope: AdminScope;
  id: string;
}): Promise<OfficeRequest | null> {
  const pool = getPool(args.databaseUrl);
  const result = await pool.query(`SELECT * FROM requests WHERE id = $1`, [args.id]);
  if (!result.rowCount) return null;
  const request = requestFromRow(result.rows[0] as never);
  if (!adminCanAccessOffice(args.scope, request.officeId)) return null;
  return request;
}

export async function updateAdminRequest(args: {
  databaseUrl: string;
  scope: AdminScope;
  id: string;
  status: OfficeRequestStatus;
  notes: string;
  actorUid: string;
  actorLabel: string;
}): Promise<OfficeRequest> {
  if (!VALID_STATUSES.includes(args.status)) {
    throw new ApiError("bad_params", "Invalid status", 400);
  }

  const request = await getRequestForAdminScope({
    databaseUrl: args.databaseUrl,
    scope: args.scope,
    id: args.id,
  });
  if (!request) {
    throw new ApiError("not_found", "الطلب غير موجود أو غير مصرح.", 404);
  }

  const trimmedNotes = args.notes.trim();
  const pool = getPool(args.databaseUrl);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE requests SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3`,
      [args.status, trimmedNotes, args.id],
    );

    const notesChanged = trimmedNotes !== request.notes;
    const statusChanged = args.status !== request.status;
    let summaryAr = "تحديث الطلب";
    if (statusChanged && notesChanged) {
      summaryAr = `تغيير الحالة من «${REQUEST_STATUS_LABELS[request.status]}» إلى «${REQUEST_STATUS_LABELS[args.status]}» وتحديث الملاحظات`;
    } else if (statusChanged) {
      summaryAr = `تغيير حالة الطلب من «${REQUEST_STATUS_LABELS[request.status]}» إلى «${REQUEST_STATUS_LABELS[args.status]}»`;
    } else if (notesChanged) {
      summaryAr = "تحديث ملاحظات الطلب";
    }

    if (statusChanged || notesChanged) {
      await appendActivityLog(client, {
        actorUid: args.actorUid,
        actorLabel: args.actorLabel,
        action: "request.updated",
        summaryAr,
        officeId: request.officeId,
        requestId: args.id,
        meta: {
          prevStatus: request.status,
          nextStatus: args.status,
        },
      });
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  const updated = await getRequestForAdminScope({
    databaseUrl: args.databaseUrl,
    scope: args.scope,
    id: args.id,
  });
  if (!updated) {
    throw new ApiError("not_found", "الطلب غير موجود.", 404);
  }
  return updated;
}

export function parseAdminScopeFromQuery(query: Record<string, unknown>): AdminScope {
  const roleRaw = String(query.role ?? "super_admin").trim();
  const role = (
    ["super_admin", "governorate_admin", "office_admin", "office_user"] as const
  ).includes(roleRaw as AdminRole)
    ? (roleRaw as AdminRole)
    : "super_admin";

  const officeIdRaw = String(query.sessionOfficeId ?? query.officeId ?? "").trim();
  const allowedRaw = String(query.allowedOfficeIds ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    role,
    officeId: officeIdRaw || null,
    ...(allowedRaw.length > 0 ? { allowedOfficeIds: allowedRaw } : {}),
  };
}

export function parseStatusFilter(
  value: unknown,
): OfficeRequestStatus | "all" | undefined {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "all") return "all";
  return VALID_STATUSES.includes(raw as OfficeRequestStatus)
    ? (raw as OfficeRequestStatus)
    : undefined;
}

export function parseTypeFilter(
  value: unknown,
): OfficeRequestType | "all" | undefined {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "all") return "all";
  return VALID_TYPES.includes(raw as OfficeRequestType)
    ? (raw as OfficeRequestType)
    : undefined;
}
