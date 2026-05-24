import {
  FieldValue,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import {
  enumerateCairoYmdRange,
  getCairoMinBookingYmd,
  getCairoYmdDaysAfter,
} from "@/lib/cairo-today-ymd";
import { BOOKING_DATE_HORIZON_DAYS } from "@/lib/office-requests/booking-constants";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export { BOOKING_DATE_HORIZON_DAYS } from "@/lib/office-requests/booking-constants";

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

export function computeAvailableBookingDates(args: {
  fromYmd: string;
  toYmd: string;
  minYmd: string;
  cap: number;
  usageByDate: Record<string, number>;
}): { availableDates: string[]; fullDates: string[] } {
  const effectiveFrom =
    args.fromYmd > args.minYmd ? args.fromYmd : args.minYmd;
  const allDays = enumerateCairoYmdRange(effectiveFrom, args.toYmd);
  const availableDates: string[] = [];
  const fullDates: string[] = [];

  for (const ymd of allDays) {
    const used = args.usageByDate[ymd] ?? 0;
    if (isBookingDayFull(used, args.cap)) {
      fullDates.push(ymd);
    } else {
      availableDates.push(ymd);
    }
  }

  return { availableDates, fullDates };
}

export async function listOfficeAvailableBookingDates(args: {
  officeId: string;
  fromYmd: string;
  toYmd: string;
  cap: number | null | undefined;
  minYmd: string;
}): Promise<{ availableDates: string[]; fullDates: string[] }> {
  const effectiveFrom =
    args.fromYmd > args.minYmd ? args.fromYmd : args.minYmd;
  const allDays = enumerateCairoYmdRange(effectiveFrom, args.toYmd);

  if (!args.cap || args.cap <= 0) {
    return { availableDates: allDays, fullDates: [] };
  }

  if (!isFirebaseAdminConfigured()) {
    return { availableDates: allDays, fullDates: [] };
  }

  const usageByDate: Record<string, number> = {};
  const db = getAdminDb();

  const requestsSnap = await db
    .collection("requests")
    .where("officeId", "==", args.officeId)
    .where("type", "==", "booking")
    .where("preferredDate", ">=", effectiveFrom)
    .where("preferredDate", "<=", args.toYmd)
    .get();

  for (const doc of requestsSnap.docs) {
    const data = doc.data();
    if (data.status === "cancelled") continue;
    const date = String(data.preferredDate ?? "");
    if (!date) continue;
    usageByDate[date] = (usageByDate[date] ?? 0) + 1;
  }

  const statsSnap = await db
    .collection(BOOKING_DAY_STATS)
    .where("officeId", "==", args.officeId)
    .where("date", ">=", effectiveFrom)
    .where("date", "<=", args.toYmd)
    .get();

  for (const doc of statsSnap.docs) {
    const data = doc.data();
    const date = String(data.date ?? "");
    if (!date) continue;
    const used = num(data.used);
    usageByDate[date] = Math.max(usageByDate[date] ?? 0, used);
  }

  return computeAvailableBookingDates({
    fromYmd: args.fromYmd,
    toYmd: args.toYmd,
    minYmd: args.minYmd,
    cap: args.cap,
    usageByDate,
  });
}

export function defaultBookingDateRange(minYmd: string): {
  from: string;
  to: string;
} {
  return {
    from: minYmd,
    to: getCairoYmdDaysAfter(BOOKING_DATE_HORIZON_DAYS, minYmd),
  };
}

export async function listOfficeAvailableBookingDatesForOffice(args: {
  officeId: string;
  cap: number | null | undefined;
  sameDayCutoffHour?: number;
  fromYmd?: string;
  toYmd?: string;
}): Promise<{
  availableDates: string[];
  fullDates: string[];
  from: string;
  to: string;
  cap: number | null;
}> {
  const minYmd = getCairoMinBookingYmd(new Date(), {
    sameDayCutoffHour: args.sameDayCutoffHour,
  });
  const defaults = defaultBookingDateRange(minYmd);
  const from = args.fromYmd ?? defaults.from;
  const to = args.toYmd ?? defaults.to;

  const { availableDates, fullDates } = await listOfficeAvailableBookingDates({
    officeId: args.officeId,
    fromYmd: from,
    toYmd: to,
    cap: args.cap,
    minYmd,
  });

  const cap =
    typeof args.cap === "number" && args.cap > 0 ? args.cap : null;

  return { availableDates, fullDates, from, to, cap };
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
