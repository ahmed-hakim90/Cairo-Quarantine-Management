import { getPool } from "@cqm/shared";
import { ApiError } from "../lib/errors.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type BookingAvailabilityResult = {
  available: boolean;
  count: number;
  cap: number | null;
  fullMessage?: string;
};

export async function getBookingAvailability(args: {
  databaseUrl: string;
  officeId: string;
  preferredDate: string;
}): Promise<BookingAvailabilityResult> {
  const { databaseUrl, officeId, preferredDate } = args;

  if (!officeId || officeId.length > 120 || !DATE_RE.test(preferredDate)) {
    throw new ApiError("bad_params", "Invalid officeId or preferredDate", 400);
  }

  const pool = getPool(databaseUrl);
  const officeResult = await pool.query<{
    daily_booking_cap: number | null;
  }>(
    `SELECT daily_booking_cap FROM offices WHERE id = $1 AND active = TRUE`,
    [officeId],
  );

  if (officeResult.rowCount === 0) {
    throw new ApiError("office_not_found", "Office not found", 404);
  }

  const cap = officeResult.rows[0]?.daily_booking_cap ?? null;
  if (cap === null || cap <= 0) {
    return { available: true, count: 0, cap: null };
  }

  const capacityResult = await pool.query<{ booked_count: number }>(
    `SELECT booked_count FROM booking_capacity
     WHERE office_id = $1 AND preferred_date = $2::date`,
    [officeId, preferredDate],
  );

  let count = capacityResult.rows[0]?.booked_count ?? 0;

  if (capacityResult.rowCount === 0) {
    const fallback = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM requests
       WHERE office_id = $1 AND preferred_date = $2::date AND type = 'booking'`,
      [officeId, preferredDate],
    );
    count = Number.parseInt(fallback.rows[0]?.count ?? "0", 10) || 0;
  }

  const available = count < cap;
  return {
    available,
    count,
    cap,
    ...(available
      ? {}
      : {
          fullMessage:
            "لا يمكن الحجز في هذا اليوم؛ تم بلوغ العدد المسموح لهذا المكتب.",
        }),
  };
}
