import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type {
  OfficeRequestStatus,
  OfficeRequestType,
} from "@/lib/office-requests/types";

export const DAILY_REQUEST_STATS = "daily_request_stats";

export type DailyRequestStats = {
  date: string;
  officeId: string;
  totalRequests: number;
  bookings: number;
  complaints: number;
  proposals: number;
  new: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  bookingNew: number;
  bookingInProgress: number;
  bookingCompleted: number;
  bookingCancelled: number;
  complaintNew: number;
  complaintInProgress: number;
  complaintCompleted: number;
  complaintCancelled: number;
  proposalNew: number;
  proposalInProgress: number;
  proposalCompleted: number;
  proposalCancelled: number;
};

export function dailyRequestStatsDocId(date: string, officeId: string): string {
  return `${date}_${officeId}`;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function emptyStats(date: string, officeId: string): DailyRequestStats {
  return {
    date,
    officeId,
    totalRequests: 0,
    bookings: 0,
    complaints: 0,
    proposals: 0,
    new: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    bookingNew: 0,
    bookingInProgress: 0,
    bookingCompleted: 0,
    bookingCancelled: 0,
    complaintNew: 0,
    complaintInProgress: 0,
    complaintCompleted: 0,
    complaintCancelled: 0,
    proposalNew: 0,
    proposalInProgress: 0,
    proposalCompleted: 0,
    proposalCancelled: 0,
  };
}

export function parseDailyRequestStats(
  date: string,
  officeId: string,
  data: FirebaseFirestore.DocumentData | undefined,
): DailyRequestStats {
  return {
    date: String(data?.date ?? date),
    officeId: String(data?.officeId ?? officeId),
    totalRequests: num(data?.totalRequests),
    bookings: num(data?.bookings),
    complaints: num(data?.complaints),
    proposals: num(data?.proposals),
    new: num(data?.new),
    inProgress: num(data?.inProgress),
    completed: num(data?.completed),
    cancelled: num(data?.cancelled),
    bookingNew: num(data?.bookingNew),
    bookingInProgress: num(data?.bookingInProgress),
    bookingCompleted: num(data?.bookingCompleted),
    bookingCancelled: num(data?.bookingCancelled),
    complaintNew: num(data?.complaintNew),
    complaintInProgress: num(data?.complaintInProgress),
    complaintCompleted: num(data?.complaintCompleted),
    complaintCancelled: num(data?.complaintCancelled),
    proposalNew: num(data?.proposalNew),
    proposalInProgress: num(data?.proposalInProgress),
    proposalCompleted: num(data?.proposalCompleted),
    proposalCancelled: num(data?.proposalCancelled),
  };
}

const TYPE_FIELD: Record<OfficeRequestType, keyof DailyRequestStats> = {
  booking: "bookings",
  complaint: "complaints",
  proposal: "proposals",
};

const STATUS_FIELD: Record<OfficeRequestStatus, keyof DailyRequestStats | null> =
  {
    new: "new",
    in_progress: "inProgress",
    contacted: "inProgress",
    completed: "completed",
    cancelled: "cancelled",
  };

const TYPE_STATUS_FIELD: Record<
  OfficeRequestType,
  Record<OfficeRequestStatus, keyof DailyRequestStats | null>
> = {
  booking: {
    new: "bookingNew",
    in_progress: "bookingInProgress",
    contacted: "bookingInProgress",
    completed: "bookingCompleted",
    cancelled: "bookingCancelled",
  },
  complaint: {
    new: "complaintNew",
    in_progress: "complaintInProgress",
    contacted: "complaintInProgress",
    completed: "complaintCompleted",
    cancelled: "complaintCancelled",
  },
  proposal: {
    new: "proposalNew",
    in_progress: "proposalInProgress",
    contacted: "proposalInProgress",
    completed: "proposalCompleted",
    cancelled: "proposalCancelled",
  },
};

function statsDateFromRequest(createdAtIso: string, preferredDate?: string): string {
  if (preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    return preferredDate;
  }
  return createdAtIso.slice(0, 10);
}

export function dailyRequestStatsRef(
  db: FirebaseFirestore.Firestore,
  date: string,
  officeId: string,
) {
  return db
    .collection(DAILY_REQUEST_STATS)
    .doc(dailyRequestStatsDocId(date, officeId));
}

/** Apply create counters inside an existing transaction (stats doc must be read first). */
export function applyDailyRequestStatsOnCreate(
  tx: Transaction,
  ref: FirebaseFirestore.DocumentReference,
  snap: FirebaseFirestore.DocumentSnapshot,
  args: {
    date: string;
    officeId: string;
    type: OfficeRequestType;
    status: OfficeRequestStatus;
  },
): void {
  const typeField = TYPE_FIELD[args.type];
  const statusField = STATUS_FIELD[args.status];
  const typeStatusField = TYPE_STATUS_FIELD[args.type][args.status];
  if (!snap.exists) {
    const base = emptyStats(args.date, args.officeId);
    tx.set(ref, {
      ...base,
      totalRequests: 1,
      [typeField]: 1,
      ...(statusField ? { [statusField]: 1 } : {}),
      ...(typeStatusField ? { [typeStatusField]: 1 } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }
  const inc: Record<string, unknown> = {
    totalRequests: FieldValue.increment(1),
    [typeField]: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (statusField) inc[statusField] = FieldValue.increment(1);
  if (typeStatusField) inc[typeStatusField] = FieldValue.increment(1);
  tx.set(ref, inc, { merge: true });
}

export function applyDailyRequestStatsOnStatusChange(
  tx: Transaction,
  ref: FirebaseFirestore.DocumentReference,
  snap: FirebaseFirestore.DocumentSnapshot,
  args: {
    date: string;
    officeId: string;
    type: OfficeRequestType;
    prevStatus: OfficeRequestStatus;
    nextStatus: OfficeRequestStatus;
  },
): void {
  const prevField = STATUS_FIELD[args.prevStatus];
  const nextField = STATUS_FIELD[args.nextStatus];
  const prevTypeField = TYPE_STATUS_FIELD[args.type][args.prevStatus];
  const nextTypeField = TYPE_STATUS_FIELD[args.type][args.nextStatus];
  if (prevField === nextField && prevTypeField === nextTypeField) return;
  if (!snap.exists) {
    const base = emptyStats(args.date, args.officeId);
    tx.set(ref, {
      ...base,
      ...(nextField ? { [nextField]: 1 } : {}),
      ...(nextTypeField ? { [nextTypeField]: 1 } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }
  const inc: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (prevField) inc[prevField] = FieldValue.increment(-1);
  if (nextField) inc[nextField] = FieldValue.increment(1);
  if (prevTypeField) inc[prevTypeField] = FieldValue.increment(-1);
  if (nextTypeField) inc[nextTypeField] = FieldValue.increment(1);
  tx.set(ref, inc, { merge: true });
}

export async function listDailyRequestStatsForOffices(args: {
  officeIds: string[];
  fromDate: string;
  toDate: string;
}): Promise<DailyRequestStats[]> {
  if (!isFirebaseAdminConfigured() || args.officeIds.length === 0) return [];
  const db = getAdminDb();
  const out: DailyRequestStats[] = [];
  for (const officeId of args.officeIds) {
    const snap = await db
      .collection(DAILY_REQUEST_STATS)
      .where("officeId", "==", officeId)
      .where("date", ">=", args.fromDate)
      .where("date", "<=", args.toDate)
      .get();
    for (const doc of snap.docs) {
      const data = doc.data();
      out.push(
        parseDailyRequestStats(
          String(data.date ?? ""),
          officeId,
          data,
        ),
      );
    }
  }
  return out;
}

export function aggregateDailyRequestStats(
  rows: DailyRequestStats[],
): DailyRequestStats {
  const base = emptyStats("", "");
  for (const row of rows) {
    base.totalRequests += row.totalRequests;
    base.bookings += row.bookings;
    base.complaints += row.complaints;
    base.proposals += row.proposals;
    base.new += row.new;
    base.inProgress += row.inProgress;
    base.completed += row.completed;
    base.cancelled += row.cancelled;
    base.bookingNew += row.bookingNew;
    base.bookingInProgress += row.bookingInProgress;
    base.bookingCompleted += row.bookingCompleted;
    base.bookingCancelled += row.bookingCancelled;
    base.complaintNew += row.complaintNew;
    base.complaintInProgress += row.complaintInProgress;
    base.complaintCompleted += row.complaintCompleted;
    base.complaintCancelled += row.complaintCancelled;
    base.proposalNew += row.proposalNew;
    base.proposalInProgress += row.proposalInProgress;
    base.proposalCompleted += row.proposalCompleted;
    base.proposalCancelled += row.proposalCancelled;
  }
  return base;
}

export function requestStatsDate(
  createdAtIso: string,
  preferredDate?: string,
): string {
  return statsDateFromRequest(createdAtIso, preferredDate);
}
