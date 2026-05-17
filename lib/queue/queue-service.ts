import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
import { normalizePhone } from "@/lib/office-requests/whatsapp-message";
import { createOfficeRequest, getOffice } from "@/lib/office-requests/store";
import type { OfficeRequest } from "@/lib/office-requests/types";
import {
  dailyStatsCreatePayload,
  dailyStatsFromDoc,
  dailyStatsId,
  emptyDailyStats,
  getDailyStats,
} from "@/lib/queue/daily-stats-service";
import {
  computeTotalNoShow,
  isQueueNumberSearch,
  nextQueueNumber,
  parseQueueNumberSearch,
  shouldIncrementTotalCompleted,
  shouldSkipNewTicket,
} from "@/lib/queue/queue-logic";
import type {
  DailyStats,
  QueueCreatedFrom,
  QueueTicket,
  QueueTicketWithRequest,
} from "@/lib/queue/types";

const REQUESTS = "requests";
const TODAY_QUEUE = "today_queue";
const DAILY_STATS = "daily_stats";

export function getTodayKey(date = new Date()): string {
  return getCairoTodayYmd(date);
}

export function getOfficeCheckinUrl(officeId: string, origin?: string): string {
  const path = `/ar/checkin?officeId=${encodeURIComponent(officeId)}`;
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    origin?.replace(/\/+$/, "") ||
    "";
  return base ? `${base}${path}` : path;
}

export function queueTicketId(args: {
  requestId: string;
  officeId: string;
  queueDate: string;
}): string {
  return `${args.queueDate}_${args.officeId}_${args.requestId}`;
}

export { formatRequestNumber } from "@/lib/office-requests/request-number";

export function normalizeRequestLookup(value: string): {
  raw: string;
  phone: string;
  requestNumbers: string[];
} {
  const raw = value.trim();
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  const numbers = new Set<string>();
  if (compact) numbers.add(compact);
  const digits = compact.replace(/\D/g, "");
  if (digits) {
    numbers.add(digits);
    numbers.add(`CQM-${digits.padStart(6, "0")}`);
  }
  return {
    raw,
    phone: normalizePhone(raw),
    requestNumbers: [...numbers],
  };
}

function iso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
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
    checkedInAt: iso(data.checkedInAt),
    ...(data.completedAt ? { completedAt: iso(data.completedAt) } : {}),
    createdFrom:
      data.createdFrom === "new_request" ? "new_request" : "existing_request",
  };
}

function requestFromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): OfficeRequest {
  const sequence =
    typeof data.requestSequence === "number" && Number.isFinite(data.requestSequence)
      ? data.requestSequence
      : undefined;
  return {
    id,
    requestNumber: String(data.requestNumber ?? id),
    ...(sequence ? { requestSequence: sequence } : {}),
    officeId: String(data.officeId ?? ""),
    officeNameAr: String(data.officeNameAr ?? ""),
    type: data.type === "complaint" || data.type === "proposal" ? data.type : "booking",
    ...(data.travelerStateId ? { travelerStateId: String(data.travelerStateId) } : {}),
    ...(data.travelerCategory ? { travelerCategory: String(data.travelerCategory) as OfficeRequest["travelerCategory"] } : {}),
    ...(data.preferredDate ? { preferredDate: String(data.preferredDate) } : {}),
    status:
      data.status === "in_progress" ||
      data.status === "contacted" ||
      data.status === "completed" ||
      data.status === "cancelled"
        ? data.status
        : "new",
    name: String(data.name ?? ""),
    phone: String(data.phone ?? ""),
    details: String(data.details ?? ""),
    notes: String(data.notes ?? ""),
    ...(data.hasSpecialNeeds === true ? { hasSpecialNeeds: true } : {}),
    ...(data.passToken ? { passToken: String(data.passToken) } : {}),
    ...(data.passTokenExpiresAt ? { passTokenExpiresAt: iso(data.passTokenExpiresAt) } : {}),
    ...(data.lastWhatsappAt ? { lastWhatsappAt: iso(data.lastWhatsappAt) } : {}),
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
  };
}

export async function findRequestByNumberOrPhone(
  value: string,
): Promise<OfficeRequest | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const lookup = normalizeRequestLookup(value);
  if (!lookup.raw) return null;
  const db = getAdminDb();

  try {
    const doc = await db.collection(REQUESTS).doc(lookup.raw).get();
    if (doc.exists) return requestFromDoc(doc.id, doc.data() ?? {});
  } catch {
    // Continue with indexed lookups.
  }

  for (const requestNumber of lookup.requestNumbers) {
    const snap = await db
      .collection(REQUESTS)
      .where("requestNumber", "==", requestNumber)
      .limit(1)
      .get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      return requestFromDoc(doc.id, doc.data());
    }
  }

  if (lookup.phone) {
    const snap = await db
      .collection(REQUESTS)
      .where("phone", "==", lookup.phone)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      return requestFromDoc(doc.id, doc.data());
    }
  }

  return null;
}

export async function checkExistingTodayQueue(
  requestId: string,
  officeId: string,
  date: string,
): Promise<QueueTicket | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const id = queueTicketId({ requestId, officeId, queueDate: date });
  const snap = await getAdminDb().collection(TODAY_QUEUE).doc(id).get();
  if (!snap.exists) return null;
  return ticketFromDoc(snap.id, snap.data() ?? {});
}

export async function createQueueTicket(args: {
  requestId: string;
  requestNumber: string;
  officeId: string;
  createdFrom: QueueCreatedFrom;
  date?: string;
}): Promise<QueueTicket> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن تسجيل الحضور.");
  }
  const queueDate = args.date ?? getTodayKey();
  const db = getAdminDb();
  const ticketRef = db
    .collection(TODAY_QUEUE)
    .doc(queueTicketId({ requestId: args.requestId, officeId: args.officeId, queueDate }));
  const statsRef = db.collection(DAILY_STATS).doc(dailyStatsId(queueDate, args.officeId));

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(ticketRef);
    if (shouldSkipNewTicket(existing.exists)) return;

    const statsSnap = await tx.get(statsRef);
    const stats = statsSnap.exists
      ? dailyStatsFromDoc(statsSnap.id, statsSnap.data() ?? {})
      : emptyDailyStats(queueDate, args.officeId);
    if (stats.closed) {
      throw new Error("تم إغلاق طابور هذا اليوم لهذا المكتب.");
    }
    const queueNumber = nextQueueNumber(stats.lastQueueNumber);
    const now = FieldValue.serverTimestamp();
    if (!statsSnap.exists) {
      tx.set(statsRef, dailyStatsCreatePayload(queueDate, args.officeId));
    }
    tx.set(ticketRef, {
      requestId: args.requestId,
      requestNumber: args.requestNumber || args.requestId,
      officeId: args.officeId,
      queueDate,
      queueNumber,
      status: "waiting",
      checkedInAt: now,
      createdFrom: args.createdFrom,
    });
    tx.set(
      statsRef,
      {
        lastQueueNumber: queueNumber,
        totalCheckedIn: FieldValue.increment(1),
        ...(args.createdFrom === "new_request"
          ? { totalNewRequests: FieldValue.increment(1) }
          : {}),
        closed: false,
        updatedAt: now,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  const saved = await ticketRef.get();
  return ticketFromDoc(saved.id, saved.data() ?? {});
}

export async function createQuickRequestAndQueue(args: {
  officeId: string;
  name: string;
  phone: string;
  details?: string;
}): Promise<{ request: OfficeRequest; ticket: QueueTicket }> {
  const date = getTodayKey();
  const created = await createOfficeRequest({
    officeId: args.officeId,
    type: "booking",
    preferredDate: date,
    name: args.name,
    phone: args.phone,
    details: args.details?.trim() || "طلب حضور سريع من QR",
  });
  const ticket = await createQueueTicket({
    requestId: created.id,
    requestNumber: created.requestNumber,
    officeId: args.officeId,
    createdFrom: "new_request",
    date,
  });
  const request = await findRequestByNumberOrPhone(created.requestNumber);
  if (!request) throw new Error("تم إنشاء الطلب لكن تعذر قراءته مرة أخرى.");
  return { request, ticket };
}

export async function completeQueueTicket(ticketId: string): Promise<QueueTicket> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن تحديث الطابور.");
  }
  const db = getAdminDb();
  const ticketRef = db.collection(TODAY_QUEUE).doc(ticketId);
  await db.runTransaction(async (tx) => {
    const ticketSnap = await tx.get(ticketRef);
    if (!ticketSnap.exists) throw new Error("رقم الدور غير موجود.");
    const ticket = ticketFromDoc(ticketSnap.id, ticketSnap.data() ?? {});
    if (!shouldIncrementTotalCompleted(ticket.status)) return;
    const statsRef = db
      .collection(DAILY_STATS)
      .doc(dailyStatsId(ticket.queueDate, ticket.officeId));
    const now = FieldValue.serverTimestamp();
    tx.update(ticketRef, {
      status: "completed",
      completedAt: now,
    });
    tx.set(
      statsRef,
      {
        date: ticket.queueDate,
        officeId: ticket.officeId,
        totalCompleted: FieldValue.increment(1),
        updatedAt: now,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
  const saved = await ticketRef.get();
  return ticketFromDoc(saved.id, saved.data() ?? {});
}

export async function findQueueTicketForOfficeDay(args: {
  officeId: string;
  date: string;
  value: string;
}): Promise<QueueTicketWithRequest | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const raw = args.value.trim();
  if (!raw) return null;
  const db = getAdminDb();
  let ticket: QueueTicket | null = null;

  if (isQueueNumberSearch(raw)) {
    const n = parseQueueNumberSearch(raw);
    const snap = await db
      .collection(TODAY_QUEUE)
      .where("officeId", "==", args.officeId)
      .where("queueDate", "==", args.date)
      .where("queueNumber", "==", n)
      .limit(1)
      .get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      ticket = ticketFromDoc(doc.id, doc.data());
    }
  }

  if (!ticket) {
    const lookup = normalizeRequestLookup(raw);
    for (const requestNumber of lookup.requestNumbers) {
      const snap = await db
        .collection(TODAY_QUEUE)
        .where("officeId", "==", args.officeId)
        .where("queueDate", "==", args.date)
        .where("requestNumber", "==", requestNumber)
        .limit(1)
        .get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        ticket = ticketFromDoc(doc.id, doc.data());
        break;
      }
    }
  }

  if (!ticket) return null;
  const requestSnap = await db.collection(REQUESTS).doc(ticket.requestId).get();
  const request = requestSnap.exists
    ? requestFromDoc(requestSnap.id, requestSnap.data() ?? {})
    : null;
  return {
    ...ticket,
    request: request
      ? {
          id: request.id,
          requestNumber: request.requestNumber,
          name: request.name,
          phone: request.phone,
        }
      : null,
  };
}

export async function getQueueDashboard(officeId: string, date = getTodayKey()): Promise<{
  stats: DailyStats;
}> {
  return {
    stats: await getDailyStats(officeId, date),
  };
}

export async function deleteTodayQueueDocs(
  officeId: string,
  date: string,
): Promise<number> {
  if (!isFirebaseAdminConfigured()) return 0;
  const db = getAdminDb();
  let deleted = 0;
  for (;;) {
    const snap = await db
      .collection(TODAY_QUEUE)
      .where("officeId", "==", officeId)
      .where("queueDate", "==", date)
      .limit(400)
      .get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
      deleted += 1;
    }
    await batch.commit();
    if (snap.size < 400) break;
  }
  return deleted;
}

export async function closeDailyQueue(
  officeId: string,
  date = getTodayKey(),
): Promise<{ stats: DailyStats; deleted: number }> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase غير مضبوط حالياً، لا يمكن إغلاق الطابور.");
  }
  const db = getAdminDb();
  const statsRef = db.collection(DAILY_STATS).doc(dailyStatsId(date, officeId));
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(statsRef);
    const stats = snap.exists
      ? dailyStatsFromDoc(snap.id, snap.data() ?? {})
      : emptyDailyStats(date, officeId);
    const totalNoShow = computeTotalNoShow(
      stats.totalCheckedIn,
      stats.totalCompleted,
    );
    tx.set(
      statsRef,
      {
        date,
        officeId,
        totalCheckedIn: stats.totalCheckedIn,
        totalCompleted: stats.totalCompleted,
        totalNoShow,
        totalNewRequests: stats.totalNewRequests,
        lastQueueNumber: stats.lastQueueNumber,
        closed: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
  const deleted = await deleteTodayQueueDocs(officeId, date);
  const saved = await statsRef.get();
  return {
    stats: saved.exists
      ? dailyStatsFromDoc(saved.id, saved.data() ?? {})
      : emptyDailyStats(date, officeId),
    deleted,
  };
}

export async function assertActiveOffice(officeId: string) {
  const office = await getOffice(officeId);
  if (!office?.active) throw new Error("المكتب غير متاح.");
  return office;
}
