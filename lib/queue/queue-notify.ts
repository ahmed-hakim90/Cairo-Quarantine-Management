import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminMessaging, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { AHEAD_NOTIFY_AT } from "@/lib/queue/queue-logic";
import { getTodayKey } from "@/lib/queue/queue-service";
import {
  queueNotifyFiveAhead,
  queueNotifyYourTurn,
} from "@/lib/queue/queue-messages";
import { countAheadInQueue, getTicketForWatch } from "@/lib/queue/queue-position";
import { getDailyStats } from "@/lib/queue/daily-stats-service";

export const QUEUE_WATCHES = "queue_watches";
export { AHEAD_NOTIFY_AT } from "@/lib/queue/queue-logic";

export type QueueWatchDoc = {
  ticketId: string;
  officeId: string;
  queueDate: string;
  queueNumber: number;
  fcmToken: string;
  notifiedFive: boolean;
  notifiedTurn: boolean;
};

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

export async function registerQueueWatch(args: {
  ticketId: string;
  fcmToken: string;
}): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط.");
  }
  const ticketId = args.ticketId.trim();
  const fcmToken = args.fcmToken.trim();
  if (!ticketId || !fcmToken) {
    throw new Error("بيانات المتابعة غير مكتملة.");
  }

  const ticket = await getTicketForWatch(ticketId);
  if (!ticket) throw new Error("التذكرة غير موجودة.");

  await getAdminDb()
    .collection(QUEUE_WATCHES)
    .doc(ticketId)
    .set({
      ticketId,
      officeId: ticket.officeId,
      queueDate: ticket.queueDate,
      queueNumber: ticket.queueNumber,
      fcmToken,
      notifiedFive: false,
      notifiedTurn: false,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
}

export async function deleteQueueWatch(ticketId: string): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;
  const id = ticketId.trim();
  if (!id) return;
  await getAdminDb().collection(QUEUE_WATCHES).doc(id).delete();
}

async function sendFcm(token: string, title: string, body: string) {
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

export type ScanNotifyResult = {
  scanned: number;
  sentFive: number;
  sentTurn: number;
  skipped: number;
};

export async function scanAndNotifyQueueWatches(args?: {
  officeId?: string;
  date?: string;
}): Promise<ScanNotifyResult> {
  if (!isFirebaseAdminConfigured()) {
    return { scanned: 0, sentFive: 0, sentTurn: 0, skipped: 0 };
  }

  const queueDate = args?.date?.trim() || getTodayKey();
  const officeFilter = args?.officeId?.trim();
  const db = getAdminDb();

  let query: FirebaseFirestore.Query = db
    .collection(QUEUE_WATCHES)
    .where("queueDate", "==", queueDate);
  if (officeFilter) {
    query = query.where("officeId", "==", officeFilter);
  }

  const snap = await query.get();
  const result: ScanNotifyResult = {
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

    const ticket = await getTicketForWatch(watch.ticketId);
    if (!ticket) {
      await doc.ref.delete();
      result.skipped += 1;
      continue;
    }

    const stats = await getDailyStats(ticket.officeId, ticket.queueDate);
    if (stats.closed || ticket.status === "completed") {
      result.skipped += 1;
      continue;
    }

    const aheadCount = await countAheadInQueue({
      officeId: ticket.officeId,
      queueDate: ticket.queueDate,
      queueNumber: ticket.queueNumber,
    });

    const updates: Record<string, unknown> = {
      queueNumber: ticket.queueNumber,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (
      aheadCount === AHEAD_NOTIFY_AT &&
      !watch.notifiedFive &&
      ticket.status === "waiting"
    ) {
      const fiveAhead = queueNotifyFiveAhead();
      const ok = await sendFcm(
        watch.fcmToken,
        fiveAhead.title,
        fiveAhead.body,
      );
      if (ok) {
        updates.notifiedFive = true;
        result.sentFive += 1;
      }
    }

    if (
      aheadCount === 0 &&
      !watch.notifiedTurn &&
      ticket.status === "waiting"
    ) {
      const yourTurn = queueNotifyYourTurn();
      const ok = await sendFcm(
        watch.fcmToken,
        yourTurn.title,
        yourTurn.body,
      );
      if (ok) {
        updates.notifiedTurn = true;
        result.sentTurn += 1;
      }
    }

    if (Object.keys(updates).length > 2) {
      await doc.ref.set(updates, { merge: true });
    }
  }

  return result;
}
