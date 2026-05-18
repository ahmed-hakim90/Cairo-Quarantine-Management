import { getPool } from "@cqm/shared";
import {
  type OfficeRequest,
  type OfficeRequestType,
  type TravelerCategory,
} from "../lib/domain.js";
import { isAdminVisibleBookingRequest } from "../lib/booking-visibility.js";
import { requestFromRow } from "../lib/db-mappers.js";
import {
  adminOfficeScope,
  parseIsoDateParam,
  type AdminScope,
} from "./admin-requests.js";
import { normalizeOfficeIds } from "../lib/domain.js";

const ALL_TYPES: OfficeRequestType[] = ["booking", "complaint", "proposal"];
const EXPORT_PAGE_SIZE = 400;
const MAX_EXPORT_ROWS = 10_000;

export type AdminExportFilters = {
  types: OfficeRequestType[];
  officeId: string | null;
  officeIds?: string[] | null | undefined;
  travelerStateIds: string[];
  travelerCategories: TravelerCategory[];
  includeUncategorizedBookings: boolean;
  createdFrom: Date | null;
  createdTo: Date | null;
  adminBookingTodayYmd?: string | null;
};

function effectiveTravelerStateId(request: OfficeRequest): string | undefined {
  const sid = request.travelerStateId?.trim();
  if (sid) return sid;
  return request.travelerCategory;
}

function requestMatchesExport(
  request: OfficeRequest,
  filters: AdminExportFilters,
): boolean {
  const typesSet = new Set(
    filters.types.length > 0 ? filters.types : ALL_TYPES,
  );
  if (!typesSet.has(request.type)) return false;

  if (
    filters.adminBookingTodayYmd &&
    !isAdminVisibleBookingRequest(request, {
      todayYmd: filters.adminBookingTodayYmd,
    })
  ) {
    return false;
  }

  const mergedStateKeys = new Set([
    ...filters.travelerStateIds,
    ...filters.travelerCategories,
  ]);
  const travelerFilterActive =
    mergedStateKeys.size > 0 || filters.includeUncategorizedBookings;

  if (request.type !== "booking" || !travelerFilterActive) return true;

  const effective = effectiveTravelerStateId(request);
  if (mergedStateKeys.size > 0 && effective && mergedStateKeys.has(effective)) {
    return true;
  }
  if (filters.includeUncategorizedBookings && !effective) {
    return true;
  }
  return false;
}

export async function listRequestsForAdminExport(args: {
  databaseUrl: string;
  scope: AdminScope;
  filters: AdminExportFilters;
  maxRows?: number;
}): Promise<{ requests: OfficeRequest[]; capped: boolean }> {
  const pool = getPool(args.databaseUrl);
  const maxRows = Math.min(args.maxRows ?? MAX_EXPORT_ROWS, MAX_EXPORT_ROWS);
  const scopedOfficeIds = adminOfficeScope(args.scope, args.filters.officeId ?? undefined);
  if (scopedOfficeIds && scopedOfficeIds.length === 0) {
    return { requests: [], capped: false };
  }

  const filterOfficeIds = normalizeOfficeIds(args.filters.officeIds ?? []);
  const queryOfficeIds = args.filters.officeId?.trim()
    ? [args.filters.officeId.trim()]
    : filterOfficeIds.length > 0
      ? filterOfficeIds
      : scopedOfficeIds;

  const collected: OfficeRequest[] = [];
  let cursor: Date | null = null;
  let capped = false;

  while (collected.length < maxRows) {
    const params: unknown[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (queryOfficeIds && queryOfficeIds.length > 0) {
      conditions.push(`office_id = ANY($${paramIndex}::text[])`);
      params.push(queryOfficeIds);
      paramIndex += 1;
    }
    if (args.filters.createdFrom) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(args.filters.createdFrom);
      paramIndex += 1;
    }
    if (args.filters.createdTo) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(args.filters.createdTo);
      paramIndex += 1;
    }
    if (cursor) {
      conditions.push(`created_at < $${paramIndex}`);
      params.push(cursor);
      paramIndex += 1;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(EXPORT_PAGE_SIZE);

    const result = await pool.query(
      `SELECT * FROM requests ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIndex}`,
      params,
    );

    if (!result.rowCount) break;

    for (const row of result.rows) {
      const request = requestFromRow(row as never);
      if (requestMatchesExport(request, args.filters)) {
        collected.push(request);
        if (collected.length >= maxRows) {
          capped = true;
          break;
        }
      }
    }

    if (capped) break;
    if ((result.rowCount ?? 0) < EXPORT_PAGE_SIZE) break;

    const last = result.rows[result.rows.length - 1] as { created_at: Date };
    cursor = last.created_at;
  }

  collected.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    requests: collected.slice(0, maxRows),
    capped,
  };
}

export function parseExportDateBounds(
  fromRaw: unknown,
  toRaw: unknown,
): { createdFrom: Date | null; createdTo: Date | null } | null {
  const from = parseIsoDateParam(fromRaw);
  const to = parseIsoDateParam(toRaw);
  if (fromRaw && !from) return null;
  if (toRaw && !to) return null;
  return { createdFrom: from, createdTo: to };
}
