import {
  FieldValue,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const BOOKING_DAY_STATS = "booking_day_stats";
export const BOOKING_DUPLICATES = "booking_duplicates";

export const BOOKING_CAPACITY_FULL_MESSAGE =
  "لا يمكن الحجز في هذا اليوم؛ تم بلوغ العدد المسموح لهذا المكتب.";

export type BookingDayStats = {
  officeId: string;
  date: string;
  cap: number;
  used: number;
};

export function bookingDayStatsDocId(officeId: string, date: string): string {
  return `${officeId}_${date}`;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function parseBookingDayStats(
  officeId: string,
  date: string,
  data: FirebaseFirestore.DocumentData | undefined,
  cap: number,
): BookingDayStats {
  return {
    officeId: String(data?.officeId ?? officeId),
    date: String(data?.date ?? date),
    cap: num(data?.cap) || cap,
    used: num(data?.used),
  };
}

export function isBookingDayFull(used: number, cap: number): boolean {
  return cap > 0 && used >= cap;
}

export function bookingDayStatsCreatePayload(
  officeId: string,
  date: string,
  cap: number,
): Record<string, unknown> {
  return {
    officeId,
    date,
    cap,
    used: 0,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export function bookingDayStatsRef(
  db: Firestore,
  officeId: string,
  date: string,
) {
  return db
    .collection(BOOKING_DAY_STATS)
    .doc(bookingDayStatsDocId(officeId, date));
}

export function bookingDuplicateRef(db: Firestore, duplicateDocId: string) {
  return db.collection(BOOKING_DUPLICATES).doc(duplicateDocId);
}

/**
 * After reading `statsSnap` in the transaction, apply capacity check and increment.
 */
export function applyBookingSlotReservation(
  tx: Transaction,
  statsRef: FirebaseFirestore.DocumentReference,
  statsSnap: FirebaseFirestore.DocumentSnapshot,
  args: { officeId: string; date: string; cap: number },
): void {
  const stats = parseBookingDayStats(
    args.officeId,
    args.date,
    statsSnap.data(),
    args.cap,
  );
  if (isBookingDayFull(stats.used, args.cap)) {
    throw new Error(BOOKING_CAPACITY_FULL_MESSAGE);
  }
  if (!statsSnap.exists) {
    tx.set(statsRef, {
      ...bookingDayStatsCreatePayload(args.officeId, args.date, args.cap),
      used: 1,
    });
  } else {
    tx.set(
      statsRef,
      {
        used: FieldValue.increment(1),
        cap: args.cap,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
}

export function releaseBookingSlotInTransaction(
  tx: Transaction,
  statsRef: FirebaseFirestore.DocumentReference,
  statsSnap: FirebaseFirestore.DocumentSnapshot,
): void {
  if (!statsSnap.exists) return;
  const used = num(statsSnap.data()?.used);
  if (used <= 0) return;
  tx.set(
    statsRef,
    {
      used: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getBookingDayAvailability(args: {
  officeId: string;
  preferredDate: string;
  cap: number;
}): Promise<{ used: number; available: boolean }> {
  if (!isFirebaseAdminConfigured() || args.cap <= 0) {
    return { used: 0, available: true };
  }
  const db = getAdminDb();
  const ref = bookingDayStatsRef(db, args.officeId, args.preferredDate);
  const snap = await ref.get();
  if (snap.exists) {
    const used = num(snap.data()?.used);
    return { used, available: used < args.cap };
  }
  const used = await countActiveBookingsForOfficeDay(
    args.officeId,
    args.preferredDate,
  );
  return { used, available: used < args.cap };
}

/** Active (non-cancelled) bookings for office/day — fallback when stats doc missing. */
export async function countActiveBookingsForOfficeDay(
  officeId: string,
  preferredDate: string,
): Promise<number> {
  if (!isFirebaseAdminConfigured()) return 0;
  const snap = await getAdminDb()
    .collection("requests")
    .where("officeId", "==", officeId)
    .where("preferredDate", "==", preferredDate)
    .where("type", "==", "booking")
    .get();
  return snap.docs.filter((doc) => doc.data().status !== "cancelled").length;
}
