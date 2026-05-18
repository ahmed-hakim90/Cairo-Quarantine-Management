import type { Redis } from "@cqm/shared";
import { getPool } from "@cqm/shared";
import {
  getQueueTicketLiveState,
  setQueueTicketLiveState,
} from "@cqm/shared";
import { ApiError } from "../lib/errors.js";
import { queuePositionMessage, type QueuePositionPublic, type QueueTicket } from "../lib/domain.js";
import { ticketFromRow } from "../lib/db-mappers.js";

export async function countAheadInQueue(args: {
  databaseUrl: string;
  officeId: string;
  queueDate: string;
  queueNumber: number;
}): Promise<number> {
  if (args.queueNumber <= 0) return 0;
  const pool = getPool(args.databaseUrl);
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM queue_tickets
     WHERE office_id = $1 AND queue_date = $2::date
       AND status = 'waiting' AND queue_number < $3`,
    [args.officeId, args.queueDate, args.queueNumber],
  );
  return Number.parseInt(result.rows[0]?.count ?? "0", 10) || 0;
}

async function isQueueClosed(
  databaseUrl: string,
  officeId: string,
  queueDate: string,
): Promise<boolean> {
  const pool = getPool(databaseUrl);
  const statsId = `${queueDate}_${officeId}`;
  const result = await pool.query<{ closed: boolean }>(
    `SELECT closed FROM daily_queue_stats WHERE id = $1`,
    [statsId],
  );
  return result.rows[0]?.closed === true;
}

export async function buildQueuePositionPublic(args: {
  databaseUrl: string;
  redis: Redis;
  ticket: QueueTicket;
}): Promise<QueuePositionPublic> {
  const queueClosed = await isQueueClosed(
    args.databaseUrl,
    args.ticket.officeId,
    args.ticket.queueDate,
  );

  if (args.ticket.status === "completed") {
    return {
      ticketId: args.ticket.id,
      queueNumber: args.ticket.queueNumber,
      status: args.ticket.status,
      aheadCount: 0,
      queueClosed,
      message: queuePositionMessage("completed", 0, queueClosed),
    };
  }

  const aheadCount = queueClosed
    ? 0
    : await countAheadInQueue({
        databaseUrl: args.databaseUrl,
        officeId: args.ticket.officeId,
        queueDate: args.ticket.queueDate,
        queueNumber: args.ticket.queueNumber,
      });

  return {
    ticketId: args.ticket.id,
    queueNumber: args.ticket.queueNumber,
    status: args.ticket.status,
    aheadCount,
    queueClosed,
    message: queuePositionMessage(args.ticket.status, aheadCount, queueClosed),
  };
}

export async function getQueueTicketState(args: {
  databaseUrl: string;
  redis: Redis;
  ticketId: string;
}): Promise<QueuePositionPublic> {
  const ticketId = args.ticketId.trim();
  if (!ticketId) {
    throw new ApiError("bad_params", "ticketId required", 400);
  }

  const cached = await getQueueTicketLiveState(args.redis, ticketId);
  if (cached) {
    const queueClosed = await isQueueClosed(
      args.databaseUrl,
      cached.officeId,
      cached.queueDate,
    );
    return {
      ticketId: cached.ticketId,
      queueNumber: cached.queueNumber,
      status: cached.status,
      aheadCount: cached.aheadCount ?? 0,
      queueClosed,
      message: queuePositionMessage(
        cached.status,
        cached.aheadCount ?? 0,
        queueClosed,
      ),
    };
  }

  const pool = getPool(args.databaseUrl);
  const snap = await pool.query(`SELECT * FROM queue_tickets WHERE id = $1`, [
    ticketId,
  ]);
  if (!snap.rowCount) {
    throw new ApiError("ticket_not_found", "رقم الدور غير موجود.", 404);
  }

  const ticket = ticketFromRow(snap.rows[0] as never);
  const position = await buildQueuePositionPublic({
    databaseUrl: args.databaseUrl,
    redis: args.redis,
    ticket,
  });

  await setQueueTicketLiveState(args.redis, {
    ticketId: ticket.id,
    officeId: ticket.officeId,
    queueDate: ticket.queueDate,
    queueNumber: ticket.queueNumber,
    status: ticket.status,
    aheadCount: position.aheadCount,
    updatedAt: new Date().toISOString(),
  });

  return position;
}
