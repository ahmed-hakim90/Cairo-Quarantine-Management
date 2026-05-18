import { getPool } from "@cqm/shared";
import { ApiError } from "../lib/errors.js";

type WatchRow = {
  ticket_id: string;
  office_id: string;
  queue_date: Date | string;
  queue_number: number;
  fcm_token: string;
  notified_five: boolean;
  notified_turn: boolean;
};

export type QueueWatchRecord = {
  ticketId: string;
  officeId: string;
  queueDate: string;
  queueNumber: number;
  fcmToken: string;
  notifiedFive: boolean;
  notifiedTurn: boolean;
};

function ymd(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function rowToWatch(row: WatchRow): QueueWatchRecord {
  return {
    ticketId: row.ticket_id,
    officeId: row.office_id,
    queueDate: ymd(row.queue_date),
    queueNumber: row.queue_number,
    fcmToken: row.fcm_token,
    notifiedFive: row.notified_five,
    notifiedTurn: row.notified_turn,
  };
}

export async function registerQueueWatchPg(args: {
  databaseUrl: string;
  ticketId: string;
  fcmToken: string;
}): Promise<void> {
  const ticketId = args.ticketId.trim();
  const fcmToken = args.fcmToken.trim();
  if (!ticketId || !fcmToken) {
    throw new ApiError("bad_params", "ticketId and fcmToken required", 400);
  }

  const pool = getPool(args.databaseUrl);
  const ticketResult = await pool.query<{
    id: string;
    office_id: string;
    queue_date: Date | string;
    queue_number: number;
  }>(
    `SELECT id, office_id, queue_date, queue_number FROM queue_tickets WHERE id = $1`,
    [ticketId],
  );
  const ticket = ticketResult.rows[0];
  if (!ticket) {
    throw new ApiError("not_found", "Ticket not found", 404);
  }

  await pool.query(
    `INSERT INTO queue_watches (
      ticket_id, office_id, queue_date, queue_number, fcm_token,
      notified_five, notified_turn, updated_at
    ) VALUES ($1, $2, $3::date, $4, $5, false, false, NOW())
    ON CONFLICT (ticket_id) DO UPDATE SET
      office_id = EXCLUDED.office_id,
      queue_date = EXCLUDED.queue_date,
      queue_number = EXCLUDED.queue_number,
      fcm_token = EXCLUDED.fcm_token,
      updated_at = NOW()`,
    [
      ticket.id,
      ticket.office_id,
      ymd(ticket.queue_date),
      ticket.queue_number,
      fcmToken,
    ],
  );
}

export async function deleteQueueWatchPg(args: {
  databaseUrl: string;
  ticketId: string;
}): Promise<void> {
  const ticketId = args.ticketId.trim();
  if (!ticketId) return;
  const pool = getPool(args.databaseUrl);
  await pool.query(`DELETE FROM queue_watches WHERE ticket_id = $1`, [ticketId]);
}

export async function listQueueWatchesForScan(args: {
  databaseUrl: string;
  queueDate: string;
  officeId?: string;
}): Promise<QueueWatchRecord[]> {
  const pool = getPool(args.databaseUrl);
  const params: unknown[] = [args.queueDate];
  let sql = `SELECT ticket_id, office_id, queue_date, queue_number, fcm_token,
                    notified_five, notified_turn
             FROM queue_watches
             WHERE queue_date = $1::date`;
  if (args.officeId?.trim()) {
    params.push(args.officeId.trim());
    sql += ` AND office_id = $2`;
  }
  const result = await pool.query<WatchRow>(sql, params);
  return result.rows.map(rowToWatch);
}

export async function updateQueueWatchNotifications(args: {
  databaseUrl: string;
  ticketId: string;
  queueNumber: number;
  notifiedFive?: boolean;
  notifiedTurn?: boolean;
}): Promise<void> {
  const pool = getPool(args.databaseUrl);
  await pool.query(
    `UPDATE queue_watches SET
      queue_number = $2,
      notified_five = COALESCE($3, notified_five),
      notified_turn = COALESCE($4, notified_turn),
      updated_at = NOW()
     WHERE ticket_id = $1`,
    [
      args.ticketId,
      args.queueNumber,
      args.notifiedFive ?? null,
      args.notifiedTurn ?? null,
    ],
  );
}

export async function deleteQueueWatchPgById(args: {
  databaseUrl: string;
  ticketId: string;
}): Promise<void> {
  await deleteQueueWatchPg(args);
}
