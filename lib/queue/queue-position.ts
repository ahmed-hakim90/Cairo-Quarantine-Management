import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getDailyStats } from "@/lib/queue/daily-stats-service";
import type {
  QueuePositionPublic,
  QueueTicket,
  QueueTicketStatus,
} from "@/lib/queue/types";

export type { QueuePositionPublic } from "@/lib/queue/types";

const TODAY_QUEUE = "today_queue";

export function computeAheadCount(
  myQueueNumber: number,
  waitingNumbersBelow: readonly number[],
): number {
  if (myQueueNumber <= 0) return 0;
  return waitingNumbersBelow.filter((n) => n < myQueueNumber).length;
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

function positionMessage(
  status: QueueTicketStatus,
  aheadCount: number,
  queueClosed: boolean,
): string {
  if (queueClosed) return "تم إغلاق طابور اليوم لهذا المكتب.";
  if (status === "completed") return "تم الانتهاء من المكتب.";
  if (aheadCount === 0) return "دورك الآن — توجه إلى الشباك.";
  if (aheadCount === 1) return "أمامك شخص واحد.";
  return `أمامك ${aheadCount} أشخاص.`;
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
      message: positionMessage("completed", 0, queueClosed),
    };
  }

  const aheadCount = queueClosed
    ? 0
    : await countAheadInQueue({
        officeId: ticket.officeId,
        queueDate: ticket.queueDate,
        queueNumber: ticket.queueNumber,
      });

  return {
    ticketId: ticket.id,
    queueNumber: ticket.queueNumber,
    status: ticket.status,
    aheadCount,
    queueClosed,
    message: positionMessage(ticket.status, aheadCount, queueClosed),
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
