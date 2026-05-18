import type { Redis } from "@cqm/shared";
import { getPool } from "@cqm/shared";
import { invalidateQueueTicketLiveState } from "@cqm/shared";
import { ApiError } from "../lib/errors.js";
import {
  dailyStatsId,
  shouldIncrementTotalCompleted,
  type QueueTicket,
} from "../lib/domain.js";
import { ticketFromRow } from "../lib/db-mappers.js";
import { recordQueueRequestStatusFromQueue } from "../lib/activity-log.js";
import { syncRequestStatusInTransaction } from "../lib/pg-request-status.js";

export async function completeQueueTicket(args: {
  databaseUrl: string;
  redis: Redis;
  ticketId: string;
}): Promise<QueueTicket> {
  const ticketId = args.ticketId.trim();
  if (!ticketId) {
    throw new ApiError("bad_params", "ticketId required", 400);
  }

  const pool = getPool(args.databaseUrl);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ticketSnap = await client.query(
      `SELECT * FROM queue_tickets WHERE id = $1 FOR UPDATE`,
      [ticketId],
    );
    if (!ticketSnap.rowCount) {
      throw new ApiError("ticket_not_found", "رقم الدور غير موجود.", 404);
    }

    const ticket = ticketFromRow(ticketSnap.rows[0] as never);
    const statusSync = await syncRequestStatusInTransaction(
      client,
      ticket.requestId,
      "completed",
    );

    if (shouldIncrementTotalCompleted(ticket.status)) {
      await client.query(
        `UPDATE queue_tickets SET status = 'completed', completed_at = NOW()
         WHERE id = $1`,
        [ticketId],
      );

      const statsId = dailyStatsId(ticket.queueDate, ticket.officeId);
      await client.query(
        `INSERT INTO daily_queue_stats (id, queue_date, office_id, total_completed)
         VALUES ($1, $2::date, $3, 1)
         ON CONFLICT (id) DO UPDATE
           SET total_completed = daily_queue_stats.total_completed + 1,
               updated_at = NOW()`,
        [statsId, ticket.queueDate, ticket.officeId],
      );
    }

    if (
      statusSync.changed &&
      statusSync.prevStatus &&
      statusSync.nextStatus &&
      statusSync.officeId
    ) {
      await recordQueueRequestStatusFromQueue(client, {
        requestId: statusSync.requestId,
        officeId: statusSync.officeId,
        prevStatus: statusSync.prevStatus,
        nextStatus: statusSync.nextStatus,
        phase: "completed",
      });
    }

    await client.query("COMMIT");

    const saved = await pool.query(`SELECT * FROM queue_tickets WHERE id = $1`, [
      ticketId,
    ]);
    const completed = ticketFromRow(saved.rows[0] as never);

    await invalidateQueueTicketLiveState(args.redis, ticketId);

    return completed;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
