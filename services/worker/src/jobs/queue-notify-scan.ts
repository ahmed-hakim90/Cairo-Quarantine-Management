import { FieldValue } from "firebase-admin/firestore";
import { getPool, type ServiceConfig } from "@cqm/shared";
import { getAdminDb, getAdminMessaging, isFirebaseAdminConfigured } from "../lib/firebase.js";
import {
  AHEAD_NOTIFY_AT,
  dailyStatsId,
  getCairoTodayYmd,
  queueNotifyFiveAhead,
  queueNotifyYourTurn,
} from "../lib/queue-domain.js";

const QUEUE_WATCHES = "queue_watches";

type QueueWatchDoc = {
  ticketId: string;
  officeId: string;
  queueDate: string;
  queueNumber: number;
  fcmToken: string;
  notifiedFive: boolean;
  notifiedTurn: boolean;
};

type TicketRow = {
  id: string;
  office_id: string;
  queue_date: Date | string;
  queue_number: number;
  status: string;
};

type PgWatchRow = {
  ticket_id: string;
  office_id: string;
  queue_date: Date | string;
  queue_number: number;
  fcm_token: string;
  notified_five: boolean;
  notified_turn: boolean;
};

export type ScanNotifyResult = {
  scanned: number;
  sentFive: number;
  sentTurn: number;
  skipped: number;
};

function usePgQueueWatches(): boolean {
  return process.env.USE_VPS_API === "true";
}

function watchFromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): QueueWatchDoc {
  return {
    ticketId: id,
    officeId: String(data.officeId ?? ""),
    queueDate: String(data.queueDate ?? ""),
    queueNumber:
      typeof data.queueNumber === "number" && Number.isFinite(data.queueNumber)
        ? data.queueNumber
        : 0,
    fcmToken: String(data.fcmToken ?? ""),
    notifiedFive: data.notifiedFive === true,
    notifiedTurn: data.notifiedTurn === true,
  };
}

function pgRowToWatch(row: PgWatchRow): QueueWatchDoc {
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

async function sendFcm(token: string, title: string, body: string): Promise<boolean> {
  try {
    await getAdminMessaging().send({
      token,
      notification: { title, body },
      webpush: {
        headers: { Urgency: "high" },
        notification: {
          title,
          body,
          icon: "/icons/icon-192.png",
        },
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function countAheadInQueue(
  config: ServiceConfig,
  args: { officeId: string; queueDate: string; queueNumber: number },
): Promise<number> {
  if (args.queueNumber <= 0) return 0;
  const pool = getPool(config.databaseUrl);
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM queue_tickets
     WHERE office_id = $1 AND queue_date = $2::date
       AND status = 'waiting' AND queue_number < $3`,
    [args.officeId, args.queueDate, args.queueNumber],
  );
  return Number.parseInt(result.rows[0]?.count ?? "0", 10) || 0;
}

async function getTicketFromPg(
  config: ServiceConfig,
  ticketId: string,
): Promise<TicketRow | null> {
  const pool = getPool(config.databaseUrl);
  const snap = await pool.query<TicketRow>(
    `SELECT id, office_id, queue_date, queue_number, status
     FROM queue_tickets WHERE id = $1`,
    [ticketId],
  );
  return snap.rows[0] ?? null;
}

async function isQueueClosed(
  config: ServiceConfig,
  officeId: string,
  queueDate: string,
): Promise<boolean> {
  const pool = getPool(config.databaseUrl);
  const statsId = dailyStatsId(queueDate, officeId);
  const result = await pool.query<{ closed: boolean }>(
    `SELECT closed FROM daily_queue_stats WHERE id = $1`,
    [statsId],
  );
  return result.rows[0]?.closed === true;
}

function ymd(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

async function listPgWatches(
  config: ServiceConfig,
  queueDate: string,
  officeFilter?: string,
): Promise<QueueWatchDoc[]> {
  const pool = getPool(config.databaseUrl);
  const params: unknown[] = [queueDate];
  let sql = `SELECT ticket_id, office_id, queue_date, queue_number, fcm_token,
                    notified_five, notified_turn
             FROM queue_watches
             WHERE queue_date = $1::date`;
  if (officeFilter) {
    params.push(officeFilter);
    sql += ` AND office_id = $2`;
  }
  const result = await pool.query<PgWatchRow>(sql, params);
  return result.rows.map(pgRowToWatch);
}

async function deletePgWatch(config: ServiceConfig, ticketId: string): Promise<void> {
  const pool = getPool(config.databaseUrl);
  await pool.query(`DELETE FROM queue_watches WHERE ticket_id = $1`, [ticketId]);
}

async function updatePgWatch(
  config: ServiceConfig,
  args: {
    ticketId: string;
    queueNumber: number;
    notifiedFive?: boolean;
    notifiedTurn?: boolean;
  },
): Promise<void> {
  const pool = getPool(config.databaseUrl);
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

async function processWatch(
  config: ServiceConfig,
  watch: QueueWatchDoc,
  usePg: boolean,
  firestoreDoc?: FirebaseFirestore.DocumentSnapshot,
): Promise<{
  sentFive: number;
  sentTurn: number;
  skipped: number;
}> {
  const outcome = { sentFive: 0, sentTurn: 0, skipped: 0 };

  if (!watch.fcmToken) {
    outcome.skipped = 1;
    return outcome;
  }

  const ticket = await getTicketFromPg(config, watch.ticketId);
  if (!ticket) {
    if (usePg) {
      await deletePgWatch(config, watch.ticketId);
    } else if (firestoreDoc) {
      await firestoreDoc.ref.delete();
    }
    outcome.skipped = 1;
    return outcome;
  }

  const ticketDate = ymd(ticket.queue_date);
  if (ticket.office_id !== watch.officeId || ticketDate !== watch.queueDate) {
    outcome.skipped = 1;
    return outcome;
  }

  const closed = await isQueueClosed(config, ticket.office_id, ticketDate);
  if (closed || ticket.status === "completed") {
    outcome.skipped = 1;
    return outcome;
  }

  const aheadCount = await countAheadInQueue(config, {
    officeId: ticket.office_id,
    queueDate: ticketDate,
    queueNumber: ticket.queue_number,
  });

  let notifiedFive = watch.notifiedFive;
  let notifiedTurn = watch.notifiedTurn;

  if (
    aheadCount === AHEAD_NOTIFY_AT &&
    !watch.notifiedFive &&
    ticket.status === "waiting"
  ) {
    const copy = queueNotifyFiveAhead();
    const ok = await sendFcm(watch.fcmToken, copy.title, copy.body);
    if (ok) {
      notifiedFive = true;
      outcome.sentFive = 1;
    }
  }

  if (
    aheadCount === 0 &&
    !watch.notifiedTurn &&
    ticket.status === "waiting"
  ) {
    const copy = queueNotifyYourTurn();
    const ok = await sendFcm(watch.fcmToken, copy.title, copy.body);
    if (ok) {
      notifiedTurn = true;
      outcome.sentTurn = 1;
    }
  }

  if (
    notifiedFive !== watch.notifiedFive ||
    notifiedTurn !== watch.notifiedTurn ||
    ticket.queue_number !== watch.queueNumber
  ) {
    if (usePg) {
      await updatePgWatch(config, {
        ticketId: watch.ticketId,
        queueNumber: ticket.queue_number,
        notifiedFive: notifiedFive !== watch.notifiedFive ? notifiedFive : undefined,
        notifiedTurn: notifiedTurn !== watch.notifiedTurn ? notifiedTurn : undefined,
      });
    } else if (firestoreDoc) {
      const updates: Record<string, unknown> = {
        queueNumber: ticket.queue_number,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (notifiedFive !== watch.notifiedFive) updates.notifiedFive = notifiedFive;
      if (notifiedTurn !== watch.notifiedTurn) updates.notifiedTurn = notifiedTurn;
      await firestoreDoc.ref.set(updates, { merge: true });
    }
  }

  return outcome;
}

/** Queue FCM scan — watches in PostgreSQL (USE_VPS_API) or Firestore. */
export async function runQueueNotifyScan(
  config: ServiceConfig,
  args?: { officeId?: string; date?: string },
): Promise<ScanNotifyResult> {
  const empty: ScanNotifyResult = {
    scanned: 0,
    sentFive: 0,
    sentTurn: 0,
    skipped: 0,
  };

  if (!isFirebaseAdminConfigured()) {
    console.info("[worker] queue-notify-scan skipped (Firebase not configured)");
    return empty;
  }

  const queueDate = args?.date?.trim() || getCairoTodayYmd();
  const officeFilter = args?.officeId?.trim();
  const usePg = usePgQueueWatches();

  const result: ScanNotifyResult = {
    scanned: 0,
    sentFive: 0,
    sentTurn: 0,
    skipped: 0,
  };

  if (usePg) {
    const watches = await listPgWatches(config, queueDate, officeFilter);
    result.scanned = watches.length;
    for (const watch of watches) {
      const partial = await processWatch(config, watch, true);
      result.sentFive += partial.sentFive;
      result.sentTurn += partial.sentTurn;
      result.skipped += partial.skipped;
    }
  } else {
    if (!isFirebaseAdminConfigured()) return empty;
    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db
      .collection(QUEUE_WATCHES)
      .where("queueDate", "==", queueDate);
    if (officeFilter) {
      query = query.where("officeId", "==", officeFilter);
    }
    const snap = await query.get();
    result.scanned = snap.size;

    for (const doc of snap.docs) {
      const watch = watchFromDoc(doc.id, doc.data());
      const partial = await processWatch(config, watch, false, doc);
      result.sentFive += partial.sentFive;
      result.sentTurn += partial.sentTurn;
      result.skipped += partial.skipped;
    }
  }

  if (result.scanned > 0) {
    console.info("[worker] queue-notify-scan", { usePg, ...result });
  }
  return result;
}
