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

export function dailyStatsCreatePayload(date: string, officeId: string) {
  return {
    date,
    officeId,
    totalCheckedIn: 0,
    totalCompleted: 0,
    totalNoShow: 0,
    totalNewRequests: 0,
    lastQueueNumber: 0,
    closed: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

