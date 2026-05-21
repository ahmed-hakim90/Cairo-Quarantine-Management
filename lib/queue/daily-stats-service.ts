import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { DailyStats } from "@/lib/queue/types";

const DAILY_STATS = "daily_stats";

function iso(value: unknown): string | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function dailyStatsId(date: string, officeId: string): string {
  return `${date}_${officeId}`;
}

export function emptyDailyStats(date: string, officeId: string): DailyStats {
  return {
    id: dailyStatsId(date, officeId),
    date,
    officeId,
    totalCheckedIn: 0,
    totalCompleted: 0,
    totalNoShow: 0,
    totalNewRequests: 0,
    lastQueueNumber: 0,
    currentServingNumber: 0,
    closed: false,
  };
}

export function dailyStatsFromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): DailyStats {
  const totalCheckedIn = num(data.totalCheckedIn);
  const totalCompleted = num(data.totalCompleted);
  return {
    id,
    date: String(data.date ?? ""),
    officeId: String(data.officeId ?? ""),
    totalCheckedIn,
    totalCompleted,
    totalNoShow: num(data.totalNoShow),
    totalNewRequests: num(data.totalNewRequests),
    lastQueueNumber: num(data.lastQueueNumber),
    currentServingNumber: num(data.currentServingNumber),
    closed: data.closed === true,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
  };
}

export async function getDailyStats(
  officeId: string,
  date: string,
): Promise<DailyStats> {
  if (!isFirebaseAdminConfigured()) return emptyDailyStats(date, officeId);
  const ref = getAdminDb().collection(DAILY_STATS).doc(dailyStatsId(date, officeId));
  const snap = await ref.get();
  if (!snap.exists) return emptyDailyStats(date, officeId);
  return dailyStatsFromDoc(snap.id, snap.data() ?? {});
}

export async function listDailyQueueStatsForOffices(args: {
  officeIds: string[];
  date: string;
}): Promise<DailyStats[]> {
  if (!isFirebaseAdminConfigured() || args.officeIds.length === 0) {
    return args.officeIds.map((officeId) =>
      emptyDailyStats(args.date, officeId),
    );
  }
  return Promise.all(
    args.officeIds.map((officeId) => getDailyStats(officeId, args.date)),
  );
}

export async function listDailyQueueStatsForOfficesInRange(args: {
  officeIds: string[];
  fromDate: string;
  toDate: string;
}): Promise<DailyStats[]> {
  if (!isFirebaseAdminConfigured() || args.officeIds.length === 0) return [];
  const db = getAdminDb();
  const out: DailyStats[] = [];
  for (const officeId of args.officeIds) {
    const snap = await db
      .collection(DAILY_STATS)
      .where("officeId", "==", officeId)
      .where("date", ">=", args.fromDate)
      .where("date", "<=", args.toDate)
      .get();
    for (const doc of snap.docs) {
      out.push(dailyStatsFromDoc(doc.id, doc.data() ?? {}));
    }
  }
  return out;
}

export type AggregatedDailyQueueStats = {
  totalCheckedIn: number;
  totalCompleted: number;
  totalNotCompleted: number;
};

export function aggregateDailyQueueStats(
  rows: DailyStats[],
): AggregatedDailyQueueStats {
  return rows.reduce(
    (acc, row) => {
      const notCompleted = row.closed
        ? row.totalNoShow
        : Math.max(0, row.totalCheckedIn - row.totalCompleted);
      return {
        totalCheckedIn: acc.totalCheckedIn + row.totalCheckedIn,
        totalCompleted: acc.totalCompleted + row.totalCompleted,
        totalNotCompleted: acc.totalNotCompleted + notCompleted,
      };
    },
    { totalCheckedIn: 0, totalCompleted: 0, totalNotCompleted: 0 },
  );
}

export function dailyStatsCreatePayload(date: string, officeId: string) {
  return {
    date,
    officeId,
    totalCheckedIn: 0,
    totalCompleted: 0,
    totalNoShow: 0,
    totalNewRequests: 0,
    lastQueueNumber: 0,
    currentServingNumber: 0,
    closed: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

