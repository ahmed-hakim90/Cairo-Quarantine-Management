import { FieldValue } from "firebase-admin/firestore";
import { getPool } from "@cqm/shared";
import { getAdminDb, getAdminMessaging, isFirebaseAdminConfigured } from "../lib/firebase.js";
import { AHEAD_NOTIFY_AT, dailyStatsId, getCairoTodayYmd, queueNotifyFiveAhead, queueNotifyYourTurn, } from "../lib/queue-domain.js";
const QUEUE_WATCHES = "queue_watches";
function watchFromDoc(id, data) {
    return {
        ticketId: id,
        officeId: String(data.officeId ?? ""),
        queueDate: String(data.queueDate ?? ""),
        queueNumber: typeof data.queueNumber === "number" && Number.isFinite(data.queueNumber)
            ? data.queueNumber
            : 0,
        fcmToken: String(data.fcmToken ?? ""),
        notifiedFive: data.notifiedFive === true,
        notifiedTurn: data.notifiedTurn === true,
    };
}
async function sendFcm(token, title, body) {
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
    }
    catch {
        return false;
    }
}
async function countAheadInQueue(config, args) {
    if (args.queueNumber <= 0)
        return 0;
    const pool = getPool(config.databaseUrl);
    const result = await pool.query(`SELECT COUNT(*)::text AS count FROM queue_tickets
     WHERE office_id = $1 AND queue_date = $2::date
       AND status = 'waiting' AND queue_number < $3`, [args.officeId, args.queueDate, args.queueNumber]);
    return Number.parseInt(result.rows[0]?.count ?? "0", 10) || 0;
}
async function getTicketFromPg(config, ticketId) {
    const pool = getPool(config.databaseUrl);
    const snap = await pool.query(`SELECT id, office_id, queue_date, queue_number, status
     FROM queue_tickets WHERE id = $1`, [ticketId]);
    return snap.rows[0] ?? null;
}
async function isQueueClosed(config, officeId, queueDate) {
    const pool = getPool(config.databaseUrl);
    const statsId = dailyStatsId(queueDate, officeId);
    const result = await pool.query(`SELECT closed FROM daily_queue_stats WHERE id = $1`, [statsId]);
    return result.rows[0]?.closed === true;
}
function ymd(value) {
    if (typeof value === "string")
        return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
}
/** Queue FCM scan — watches in Firestore, queue state in PostgreSQL. */
export async function runQueueNotifyScan(config, args) {
    const empty = {
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
    const db = getAdminDb();
    let query = db
        .collection(QUEUE_WATCHES)
        .where("queueDate", "==", queueDate);
    if (officeFilter) {
        query = query.where("officeId", "==", officeFilter);
    }
    const snap = await query.get();
    const result = {
        scanned: snap.size,
        sentFive: 0,
        sentTurn: 0,
        skipped: 0,
    };
    for (const doc of snap.docs) {
        const watch = watchFromDoc(doc.id, doc.data());
        if (!watch.fcmToken) {
            result.skipped += 1;
            continue;
        }
        const ticket = await getTicketFromPg(config, watch.ticketId);
        if (!ticket) {
            await doc.ref.delete();
            result.skipped += 1;
            continue;
        }
        const ticketDate = ymd(ticket.queue_date);
        if (ticket.office_id !== watch.officeId ||
            ticketDate !== watch.queueDate) {
            result.skipped += 1;
            continue;
        }
        const closed = await isQueueClosed(config, ticket.office_id, ticketDate);
        if (closed || ticket.status === "completed") {
            result.skipped += 1;
            continue;
        }
        const aheadCount = await countAheadInQueue(config, {
            officeId: ticket.office_id,
            queueDate: ticketDate,
            queueNumber: ticket.queue_number,
        });
        const updates = {
            queueNumber: ticket.queue_number,
            updatedAt: FieldValue.serverTimestamp(),
        };
        if (aheadCount === AHEAD_NOTIFY_AT &&
            !watch.notifiedFive &&
            ticket.status === "waiting") {
            const copy = queueNotifyFiveAhead();
            const ok = await sendFcm(watch.fcmToken, copy.title, copy.body);
            if (ok) {
                updates.notifiedFive = true;
                result.sentFive += 1;
            }
        }
        if (aheadCount === 0 &&
            !watch.notifiedTurn &&
            ticket.status === "waiting") {
            const copy = queueNotifyYourTurn();
            const ok = await sendFcm(watch.fcmToken, copy.title, copy.body);
            if (ok) {
                updates.notifiedTurn = true;
                result.sentTurn += 1;
            }
        }
        if (Object.keys(updates).length > 2) {
            await doc.ref.set(updates, { merge: true });
        }
    }
    if (result.scanned > 0) {
        console.info("[worker] queue-notify-scan", result);
    }
    return result;
}
