import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getDailyStats } from "@/lib/queue/daily-stats-service";
import { queuePositionMessage } from "@/lib/queue/queue-messages";
import type { QueuePositionPublic, QueueTicket } from "@/lib/queue/types";

export type { QueuePositionPublic } from "@/lib/queue/types";

const TODAY_QUEUE = "today_queue";

export function computeAheadCount(
  myQueueNumber: number,
  waitingNumbersBelow: readonly number[],
): number {
  if (myQueueNumber <= 0) return 0;
  return waitingNumbersBelow.filter((n) => n < myQueueNumber).length;
}

/** Fast estimate from daily stats serving pointer (no Firestore count). */
export function computeAheadApprox(
  queueNumber: number,
  currentServingNumber: number,
): number {
  if (queueNumber <= 0) return 0;
  return Math.max(0, queueNumber - currentServingNumber - 1);
}

function ticketFromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): QueueTicket {
  return {
    id,
    requestId: String(data.requestId ?? ""),
    requestNumber: String(data.requestNumber ?? data.requestId ?? ""),
    officeId: String(data.officeId ?? ""),
    queueDate: String(data.queueDate ?? ""),
    queueNumber:
      typeof data.queueNumber === "number" && Number.isFinite(data.queueNumber)
        ? data.queueNumber
        : 0,
    status: data.status === "completed" ? "completed" : "waiting",
    checkedInAt:
      typeof data.checkedInAt === "string"
        ? data.checkedInAt
        : new Date().toISOString(),
    createdFrom:
      data.createdFrom === "new_request" ? "new_request" : "existing_request",
  };
}

export async function countAheadInQueue(args: {
  officeId: string;
  queueDate: string;
  queueNumber: number;
}): Promise<number> {
  if (!isFirebaseAdminConfigured()) return 0;
  if (args.queueNumber <= 0) return 0;

  const snap = await getAdminDb()
    .collection(TODAY_QUEUE)
    .where("officeId", "==", args.officeId)
    .where("queueDate", "==", args.queueDate)
    .where("status", "==", "waiting")
    .where("queueNumber", "<", args.queueNumber)
    .count()
    .get();

  return snap.data().count;
}

export async function getQueuePositionPublic(
  ticketId: string,
): Promise<QueuePositionPublic | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const id = ticketId.trim();
  if (!id) return null;

  const snap = await getAdminDb().collection(TODAY_QUEUE).doc(id).get();
  if (!snap.exists) return null;

  const ticket = ticketFromDoc(snap.id, snap.data() ?? {});
  const stats = await getDailyStats(ticket.officeId, ticket.queueDate);
  const queueClosed = stats.closed;

  if (ticket.status === "completed") {
    return {
      ticketId: ticket.id,
      queueNumber: ticket.queueNumber,
      status: ticket.status,
      aheadCount: 0,
      queueClosed,
      message: queuePositionMessage("completed", 0, queueClosed),
    };
  }

  const serving = stats.currentServingNumber ?? 0;
  let aheadCount = computeAheadApprox(ticket.queueNumber, serving);
  if (!queueClosed && aheadCount <= 5) {
    aheadCount = await countAheadInQueue({
      officeId: ticket.officeId,
      queueDate: ticket.queueDate,
      queueNumber: ticket.queueNumber,
    });
  }
  if (queueClosed) aheadCount = 0;

  return {
    ticketId: ticket.id,
    queueNumber: ticket.queueNumber,
    status: ticket.status,
    aheadCount,
    queueClosed,
    message: queuePositionMessage(ticket.status, aheadCount, queueClosed),
  };
}

export async function getTicketForWatch(
  ticketId: string,
): Promise<QueueTicket | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const snap = await getAdminDb().collection(TODAY_QUEUE).doc(ticketId.trim()).get();
  if (!snap.exists) return null;
  return ticketFromDoc(snap.id, snap.data() ?? {});
}
