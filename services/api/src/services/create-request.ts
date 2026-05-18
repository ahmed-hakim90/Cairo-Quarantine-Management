import { randomBytes } from "node:crypto";
import { getPool } from "@cqm/shared";
import { ApiError } from "../lib/errors.js";
import {
  DUPLICATE_BOOKING_MESSAGE,
  type CreatedOfficeRequestPublic,
  type OfficeRequestType,
  bookingPassTokenExpiresAt,
  findMatchingDuplicateBooking,
  getCairoMinBookingYmd,
  getCairoTodayYmd,
  normalizeGovernorateId,
  normalizePhoneForStorage,
  officeAcceptsTravelerState,
  phoneLookupVariants,
  formatRequestNumber,
  DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR,
} from "../lib/domain.js";
import { officeFromRow, publicRequestStatus, requestFromRow } from "../lib/db-mappers.js";

const REQUEST_TYPES: OfficeRequestType[] = ["booking", "complaint", "proposal"];
const MAX_OFFICE_ID_LENGTH = 120;
const MAX_GOVERNORATE_ID_LENGTH = 80;
const MAX_TRAVELER_STATE_ID_LENGTH = 80;
const MAX_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 30;
const MAX_DETAILS_LENGTH = 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type CreateRequestInput = {
  governorateId: string;
  officeId: string;
  type: OfficeRequestType;
  travelerStateId?: string;
  preferredDate?: string;
  name: string;
  phone: string;
  details: string;
  hasSpecialNeeds?: boolean;
  hasElderly?: boolean;
};

async function getBookingCutoffHour(databaseUrl: string): Promise<number> {
  const pool = getPool(databaseUrl);
  const result = await pool.query<{ value: { bookingSameDayCutoffHour?: number } }>(
    `SELECT value FROM app_settings WHERE key = 'app'`,
  );
  const raw = result.rows[0]?.value?.bookingSameDayCutoffHour;
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR;
  return Math.min(23, Math.max(0, Math.floor(n)));
}

async function listActiveTravelerStateIds(databaseUrl: string): Promise<Set<string>> {
  const pool = getPool(databaseUrl);
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM traveler_states WHERE active = TRUE`,
  );
  if (result.rowCount === 0) {
    return new Set(["international", "hajj_umrah", "citizen"]);
  }
  return new Set(result.rows.map((r) => r.id));
}

export async function createOfficeRequest(args: {
  databaseUrl: string;
  input: CreateRequestInput;
}): Promise<CreatedOfficeRequestPublic> {
  const { databaseUrl, input } = args;
  const pool = getPool(databaseUrl);

  const governorateId = normalizeGovernorateId(input.governorateId);
  const officeId = input.officeId.trim();
  const type = input.type;
  const travelerStateId = input.travelerStateId?.trim();
  const preferredDate = input.preferredDate?.trim();
  const name = input.name.trim();
  const phone = input.phone.trim();
  const details = input.details.trim();

  if (!officeId || officeId.length > MAX_OFFICE_ID_LENGTH) {
    throw new ApiError("bad_params", "Invalid office", 400);
  }
  if (input.governorateId.length > MAX_GOVERNORATE_ID_LENGTH) {
    throw new ApiError("bad_params", "Invalid governorate", 400);
  }
  if (!REQUEST_TYPES.includes(type)) {
    throw new ApiError("bad_params", "Invalid request type", 400);
  }
  if (travelerStateId && travelerStateId.length > MAX_TRAVELER_STATE_ID_LENGTH) {
    throw new ApiError("bad_params", "Invalid traveler state", 400);
  }
  if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
    throw new ApiError("bad_params", "Invalid name", 400);
  }
  if (phone.length > MAX_PHONE_LENGTH || !/^[+\d\s()-]{9,20}$/.test(phone)) {
    throw new ApiError("bad_params", "Invalid phone", 400);
  }
  if (details.length > MAX_DETAILS_LENGTH) {
    throw new ApiError("bad_params", "Details too long", 400);
  }
  if (type !== "booking" && details.length < 5) {
    throw new ApiError("bad_params", "Details required", 400);
  }

  const officeResult = await pool.query(
    `SELECT * FROM offices WHERE id = $1`,
    [officeId],
  );
  if (officeResult.rowCount === 0) {
    throw new ApiError("office_not_found", "Office not found", 404);
  }
  const office = officeFromRow(officeResult.rows[0] as never);
  if (!office.active) {
    throw new ApiError("office_inactive", "المكتب المختار غير متاح.", 400);
  }
  if ((office.governorateId || "cairo") !== governorateId) {
    throw new ApiError(
      "office_governorate_mismatch",
      "هذا المكتب لا يتبع المحافظة المختارة. اختر مكتباً آخر.",
      400,
    );
  }

  const allowedStateIds = await listActiveTravelerStateIds(databaseUrl);

  if (type === "booking") {
    if (!travelerStateId || !allowedStateIds.has(travelerStateId)) {
      throw new ApiError("bad_params", "Traveler state required", 400);
    }
    if (!officeAcceptsTravelerState(office, travelerStateId)) {
      throw new ApiError(
        "office_traveler_mismatch",
        "هذا المكتب لا يخدم حالة المسافر المختارة. اختر مكتباً آخر.",
        400,
      );
    }
    if (!preferredDate || !DATE_RE.test(preferredDate)) {
      throw new ApiError("bad_params", "Preferred date required", 400);
    }
    const cutoffHour = await getBookingCutoffHour(databaseUrl);
    const minYmd = getCairoMinBookingYmd(new Date(), {
      sameDayCutoffHour: cutoffHour,
    });
    const todayYmd = getCairoTodayYmd();
    if (preferredDate < minYmd) {
      throw new ApiError(
        "date_not_bookable",
        preferredDate < todayYmd
          ? "لا يمكن الحجز في تاريخ سابق."
          : `لا يمكن الحجز لنفس اليوم بعد الساعة ${String(cutoffHour).padStart(2, "0")}:00.`,
        400,
      );
    }
  }

  const passToken = randomBytes(24).toString("base64url");
  const passTokenExpiresAt = bookingPassTokenExpiresAt(new Date());
  const storedPhone = normalizePhoneForStorage(phone);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (type === "booking" && preferredDate && travelerStateId) {
      const cap = office.dailyBookingCap;
      if (typeof cap === "number" && cap > 0) {
        await client.query(
          `INSERT INTO booking_capacity (office_id, preferred_date, booked_count, daily_cap)
           VALUES ($1, $2::date, 0, $3)
           ON CONFLICT (office_id, preferred_date) DO NOTHING`,
          [officeId, preferredDate, cap],
        );
        const locked = await client.query<{ booked_count: number; daily_cap: number | null }>(
          `SELECT booked_count, daily_cap FROM booking_capacity
           WHERE office_id = $1 AND preferred_date = $2::date
           FOR UPDATE`,
          [officeId, preferredDate],
        );
        const row = locked.rows[0];
        const booked = row?.booked_count ?? 0;
        const dailyCap = row?.daily_cap ?? cap;
        if (dailyCap != null && dailyCap > 0 && booked >= dailyCap) {
          throw new ApiError(
            "day_full",
            "لا يمكن الحجز في هذا اليوم؛ تم بلوغ العدد المسموح لهذا المكتب.",
            409,
          );
        }
      }

      const phones = phoneLookupVariants(phone);
      const dupResult = await client.query<{
        status: string;
        traveler_state_id: string | null;
        name: string;
      }>(
        `SELECT status, traveler_state_id, name FROM requests
         WHERE office_id = $1 AND preferred_date = $2::date AND type = 'booking'
           AND phone = ANY($3::text[])`,
        [officeId, preferredDate, phones],
      );
      const duplicate = findMatchingDuplicateBooking(
        dupResult.rows.map((r) => ({
          status: r.status as never,
          travelerStateId: r.traveler_state_id ?? undefined,
          name: r.name,
        })),
        { travelerStateId, name },
      );
      if (duplicate) {
        throw new ApiError("duplicate_booking", DUPLICATE_BOOKING_MESSAGE, 409);
      }
    }

    const counterResult = await client.query<{ last_request_sequence: number }>(
      `INSERT INTO office_request_counters (office_id, last_request_sequence)
       VALUES ($1, 1)
       ON CONFLICT (office_id) DO UPDATE
         SET last_request_sequence = office_request_counters.last_request_sequence + 1,
             updated_at = NOW()
       RETURNING last_request_sequence`,
      [officeId],
    );
    const requestSequence = counterResult.rows[0]!.last_request_sequence;
    const requestNumber = formatRequestNumber(officeId, requestSequence);

    const stateLabel =
      type === "booking" && travelerStateId
        ? (
            await client.query<{ label_ar: string }>(
              `SELECT label_ar FROM traveler_states WHERE id = $1`,
              [travelerStateId],
            )
          ).rows[0]?.label_ar ?? travelerStateId
        : "";

    const finalDetails =
      type === "booking" && details.length === 0
        ? `حالة المسافر: ${stateLabel}\nالتاريخ المطلوب: ${preferredDate}`
        : details;

    const insertResult = await client.query(
      `INSERT INTO requests (
        request_number, request_sequence, governorate_id, office_id, office_name_ar,
        type, traveler_state_id, preferred_date, status, name, phone, details, notes,
        has_special_needs, has_elderly, pass_token, pass_token_expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::date, 'new', $9, $10, $11, '', $12, $13, $14, $15
      )
      RETURNING *`,
      [
        requestNumber,
        requestSequence,
        governorateId,
        officeId,
        office.nameAr,
        type,
        type === "booking" ? travelerStateId : null,
        type === "booking" ? preferredDate : null,
        name,
        storedPhone,
        finalDetails,
        type === "booking" && input.hasSpecialNeeds === true,
        type === "booking" && input.hasElderly === true,
        passToken,
        passTokenExpiresAt,
      ],
    );

    if (type === "booking" && preferredDate) {
      const cap = office.dailyBookingCap;
      if (typeof cap === "number" && cap > 0) {
        await client.query(
          `INSERT INTO booking_capacity (office_id, preferred_date, booked_count, daily_cap)
           VALUES ($1, $2::date, 1, $3)
           ON CONFLICT (office_id, preferred_date) DO UPDATE
             SET booked_count = booking_capacity.booked_count + 1,
                 daily_cap = COALESCE(booking_capacity.daily_cap, EXCLUDED.daily_cap),
                 updated_at = NOW()`,
          [officeId, preferredDate, cap],
        );
      }
    }

    await client.query("COMMIT");

    const request = requestFromRow(insertResult.rows[0] as never);
    return {
      ...publicRequestStatus(request, { includePassToken: true }),
      passToken,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
