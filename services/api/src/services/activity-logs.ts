import { getPool } from "@cqm/shared";
import { ApiError } from "../lib/errors.js";
import { adminCanAccessOffice, type AdminRole } from "../lib/domain.js";
import { adminOfficeScope, type AdminScope } from "./admin-requests.js";

export type ActivityLogEntry = {
  id: string;
  createdAt: string;
  actorUid: string;
  actorLabel: string;
  action: string;
  summaryAr: string;
  officeId: string | null;
  requestId?: string;
  meta?: Record<string, unknown>;
};

type ActivityLogRow = {
  id: string;
  created_at: Date;
  actor_uid: string;
  actor_label: string;
  action: string;
  summary_ar: string;
  office_id: string | null;
  request_id: string | null;
  meta: Record<string, unknown> | null;
};

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 100;

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

function rowToEntry(row: ActivityLogRow): ActivityLogEntry {
  return {
    id: row.id,
    createdAt: row.created_at.toISOString(),
    actorUid: row.actor_uid,
    actorLabel: row.actor_label,
    action: row.action,
    summaryAr: row.summary_ar,
    officeId: row.office_id,
    ...(row.request_id ? { requestId: row.request_id } : {}),
    ...(row.meta && typeof row.meta === "object" && Object.keys(row.meta).length > 0
      ? { meta: row.meta }
      : {}),
  };
}

export async function listActivityLogs(args: {
  databaseUrl: string;
  scope: AdminScope;
  limit?: number;
  cursor?: string | null;
  createdFrom?: Date | null;
  createdTo?: Date | null;
  officeFilter?: string | null;
  actorUid?: string | null;
  requestId?: string | null;
}): Promise<{ items: ActivityLogEntry[]; nextCursor: string | null }> {
  const pool = getPool(args.databaseUrl);
  const pageSize = Math.min(
    Math.max(1, args.limit ?? DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const officeIds = adminOfficeScope(args.scope, args.officeFilter ?? undefined);
  if (officeIds && officeIds.length === 0) {
    return { items: [], nextCursor: null };
  }

  if (args.requestId?.trim()) {
    const requestId = args.requestId.trim();
    const request = await pool.query<{ office_id: string }>(
      `SELECT office_id FROM requests WHERE id = $1`,
      [requestId],
    );
    const officeId = request.rows[0]?.office_id;
    if (!officeId || !adminCanAccessOffice(args.scope, officeId)) {
      throw new ApiError("forbidden", "Forbidden", 403);
    }
  }

  const params: unknown[] = [];
  let paramIndex = 1;
  const conditions: string[] = [];

  if (officeIds) {
    conditions.push(`office_id = ANY($${paramIndex}::text[])`);
    params.push(officeIds);
    paramIndex += 1;
  }
  if (args.actorUid?.trim()) {
    conditions.push(`actor_uid = $${paramIndex}`);
    params.push(args.actorUid.trim());
    paramIndex += 1;
  }
  if (args.requestId?.trim()) {
    conditions.push(`request_id = $${paramIndex}`);
    params.push(args.requestId.trim());
    paramIndex += 1;
  }
  if (args.createdFrom) {
    conditions.push(`created_at >= $${paramIndex}`);
    params.push(args.createdFrom);
    paramIndex += 1;
  }
  if (args.createdTo) {
    conditions.push(`created_at <= $${paramIndex}`);
    params.push(args.createdTo);
    paramIndex += 1;
  }

  const cursorDate = decodeCursor(args.cursor);
  if (cursorDate) {
    conditions.push(`created_at < $${paramIndex}`);
    params.push(cursorDate);
    paramIndex += 1;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(pageSize + 1);

  const result = await pool.query<ActivityLogRow>(
    `SELECT id, created_at, actor_uid, actor_label, action, summary_ar,
            office_id, request_id, meta
     FROM activity_logs
     ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIndex}`,
    params,
  );

  const rows = result.rows;
  const items = rows.slice(0, pageSize).map(rowToEntry);
  const nextCursor =
    rows.length > pageSize
      ? encodeCursor(items[items.length - 1]!.createdAt)
      : null;

  return { items, nextCursor };
}

export async function listLatestActivityLogsByRequestIds(args: {
  databaseUrl: string;
  requestIds: string[];
}): Promise<Record<string, ActivityLogEntry>> {
  const pool = getPool(args.databaseUrl);
  const unique = [...new Set(args.requestIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return {};

  const result = await pool.query<ActivityLogRow>(
    `SELECT DISTINCT ON (request_id)
            id, created_at, actor_uid, actor_label, action, summary_ar,
            office_id, request_id, meta
     FROM activity_logs
     WHERE request_id = ANY($1::text[])
     ORDER BY request_id, created_at DESC`,
    [unique],
  );

  const latest: Record<string, ActivityLogEntry> = {};
  for (const row of result.rows) {
    if (row.request_id) {
      latest[row.request_id] = rowToEntry(row);
    }
  }
  return latest;
}

export function parseActivityLogScopeFromQuery(
  query: Record<string, unknown>,
): AdminScope {
  const role = String(query.role ?? "super_admin").trim() as AdminRole;
  const officeId = String(query.sessionOfficeId ?? "").trim() || null;
  const allowedRaw = String(query.allowedOfficeIds ?? "").trim();
  const allowedOfficeIds = allowedRaw
    ? allowedRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  return { role, officeId, allowedOfficeIds };
}
