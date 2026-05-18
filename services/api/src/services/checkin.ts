import type { Redis } from "@cqm/shared";
import { getPool } from "@cqm/shared";
import {
  bumpOfficeDayLastQueueNumber,
  setQueueTicketLiveState,
} from "@cqm/shared";
import { ApiError, isApiError } from "../lib/errors.js";
import {
  dailyStatsId,
  getCairoTodayYmd,
  getOfficeTravelerStateIds,
  nextQueueNumber,
  normalizeRequestLookup,
  queueTicketId,
  shouldSkipNewTicket,
  type OfficeRequest,
  type QueuePositionPublic,
  type QueueTicket,
} from "../lib/domain.js";
import { officeFromRow, requestFromRow, ticketFromRow } from "../lib/db-mappers.js";
import { recordQueueRequestStatusFromQueue } from "../lib/activity-log.js";
import { syncRequestStatusInTransaction } from "../lib/pg-request-status.js";
import { createOfficeRequest, type CreateRequestInput } from "./create-request.js";
import { buildQueuePositionPublic } from "./queue-position.js";

export type CheckinLookupBody = {
  mode: "lookup";
  officeId: string;
  lookup: string;
};

export type CheckinQuickBody = {
  mode: "quick";
  officeId: string;
  name: string;
  phone: string;
  travelerStateId: string;
  hasSpecialNeeds?: boolean;
  hasElderly?: boolean;
  details?: string;
};

export type CheckinRestoreBody = {
  mode: "restore";
  officeId: string;
  ticketId: string;
};

export type CheckinBody = CheckinLookupBody | CheckinQuickBody | CheckinRestoreBody;

export type CheckinSuccess = {
  ok: true;
  ticket: QueueTicket;
  citizenName?: string;
  passToken?: string;
  requestType?: OfficeRequest["type"];
  requestId?: string;
  officeNameAr?: string;
  preferredDate?: string;
  initialPosition?: QueuePositionPublic;
};

export type CheckinFailure = {
  ok: false;
  error: string;
  needsQuickForm?: boolean;
  lookupValue?: string;
};

export type CheckinResult = CheckinSuccess | CheckinFailure;

async function getActiveOffice(databaseUrl: string, officeId: string) {
  const pool = getPool(databaseUrl);
  const result = await pool.query(`SELECT * FROM offices WHERE id = $1`, [officeId]);
  if (result.rowCount === 0) {
    throw new ApiError("office_not_found", "المكتب غير موجود.", 404);
  }
  const office = officeFromRow(result.rows[0] as never);
  if (!office.active) {
    throw new ApiError("office_inactive", "المكتب غير متاح.", 400);
  }
  return office;
}

export async function findRequestByNumberOrPhone(
  databaseUrl: string,
  value: string,
): Promise<OfficeRequest | null> {
  const lookup = normalizeRequestLookup(value);
  if (!lookup.raw) return null;
  const pool = getPool(databaseUrl);

  const byId = await pool.query(`SELECT * FROM requests WHERE id = $1`, [lookup.raw]);
  if (byId.rowCount && byId.rowCount > 0) {
    return requestFromRow(byId.rows[0] as never);
  }

  for (const requestNumber of lookup.requestNumbers) {
    const snap = await pool.query(
      `SELECT * FROM requests WHERE request_number = $1 LIMIT 1`,
      [requestNumber],
    );
    if (snap.rowCount && snap.rowCount > 0) {
      return requestFromRow(snap.rows[0] as never);
    }
  }

  const matches: OfficeRequest[] = [];
  for (const phone of lookup.phoneVariants) {
    const snap = await pool.query(
      `SELECT * FROM requests WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`,
      [phone],
    );
    if (snap.rowCount && snap.rowCount > 0) {
      matches.push(requestFromRow(snap.rows[0] as never));
    }
  }
  matches.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return matches[0] ?? null;
}

export async function createQueueTicket(args: {
  databaseUrl: string;
  redis: Redis;
  requestId: string;
  requestNumber: string;
  officeId: string;
  createdFrom: "existing_request" | "new_request";
  date?: string;
}): Promise<QueueTicket> {
  const queueDate = args.date ?? getCairoTodayYmd();
  const ticketId = queueTicketId({
    requestId: args.requestId,
    officeId: args.officeId,
    queueDate,
  });
  const statsId = dailyStatsId(queueDate, args.officeId);
  const pool = getPool(args.databaseUrl);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingSnap = await client.query(
      `SELECT * FROM queue_tickets WHERE id = $1 FOR UPDATE`,
      [ticketId],
    );
    const existingExists = (existingSnap.rowCount ?? 0) > 0;

    let statusSync = await syncRequestStatusInTransaction(
      client,
      args.requestId,
      "checked_in",
    );

    if (shouldSkipNewTicket(existingExists)) {
      await client.query("COMMIT");
    } else {
      const statsSnap = await client.query<{
        closed: boolean;
        last_queue_number: number;
      }>(
        `SELECT closed, last_queue_number FROM daily_queue_stats WHERE id = $1 FOR UPDATE`,
        [statsId],
      );
      const statsRow = statsSnap.rows[0];
      if (statsRow?.closed) {
        throw new ApiError(
          "queue_closed",
          "تم إغلاق طابور هذا اليوم لهذا المكتب.",
          409,
        );
      }

      const lastQueueNumber = statsRow?.last_queue_number ?? 0;
      const queueNumber = nextQueueNumber(lastQueueNumber);

      if (!statsRow) {
        await client.query(
          `INSERT INTO daily_queue_stats (
            id, queue_date, office_id, total_checked_in, total_new_requests,
            last_queue_number, closed
          ) VALUES ($1, $2::date, $3, 1, $4, $5, FALSE)`,
          [
            statsId,
            queueDate,
            args.officeId,
            args.createdFrom === "new_request" ? 1 : 0,
            queueNumber,
          ],
        );
      } else {
        await client.query(
          `UPDATE daily_queue_stats SET
            last_queue_number = $1,
            total_checked_in = total_checked_in + 1,
            total_new_requests = total_new_requests + $2,
            closed = FALSE,
            updated_at = NOW()
           WHERE id = $3`,
          [
            queueNumber,
            args.createdFrom === "new_request" ? 1 : 0,
            statsId,
          ],
        );
      }

      await client.query(
        `INSERT INTO queue_tickets (
          id, request_id, request_number, office_id, queue_date, queue_number,
          status, created_from
        ) VALUES ($1, $2, $3, $4, $5::date, $6, 'waiting', $7)`,
        [
          ticketId,
          args.requestId,
          args.requestNumber || args.requestId,
          args.officeId,
          queueDate,
          queueNumber,
          args.createdFrom,
        ],
      );

      await client.query("COMMIT");
      await bumpOfficeDayLastQueueNumber(
        args.redis,
        args.officeId,
        queueDate,
        queueNumber,
      );
    }

    if (
      statusSync.changed &&
      statusSync.prevStatus &&
      statusSync.nextStatus &&
      statusSync.officeId
    ) {
      const logClient = await pool.connect();
      try {
        await logClient.query("BEGIN");
        await recordQueueRequestStatusFromQueue(logClient, {
          requestId: statusSync.requestId,
          officeId: statusSync.officeId,
          prevStatus: statusSync.prevStatus,
          nextStatus: statusSync.nextStatus,
          phase: "checked_in",
        });
        await logClient.query("COMMIT");
      } catch {
        await logClient.query("ROLLBACK");
      } finally {
        logClient.release();
      }
    }

    const saved = await pool.query(`SELECT * FROM queue_tickets WHERE id = $1`, [
      ticketId,
    ]);
    const ticket = ticketFromRow(saved.rows[0] as never);
    const position = await buildQueuePositionPublic({
      databaseUrl: args.databaseUrl,
      redis: args.redis,
      ticket,
    });
    await setQueueTicketLiveState(args.redis, {
      ticketId: ticket.id,
      officeId: ticket.officeId,
      queueDate: ticket.queueDate,
      queueNumber: ticket.queueNumber,
      status: ticket.status,
      aheadCount: position.aheadCount,
      updatedAt: new Date().toISOString(),
    });
    return ticket;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function successPayload(args: {
  databaseUrl: string;
  redis: Redis;
  request: OfficeRequest;
  ticket: QueueTicket;
}): Promise<CheckinSuccess> {
  const initialPosition = await buildQueuePositionPublic({
    databaseUrl: args.databaseUrl,
    redis: args.redis,
    ticket: args.ticket,
  });
  return {
    ok: true,
    ticket: args.ticket,
    citizenName: args.request.name,
    requestId: args.request.id,
    requestType: args.request.type,
    officeNameAr: args.request.officeNameAr,
    ...(args.request.preferredDate ? { preferredDate: args.request.preferredDate } : {}),
    ...(args.request.passToken ? { passToken: args.request.passToken } : {}),
    initialPosition,
  };
}

export async function processCheckin(args: {
  databaseUrl: string;
  redis: Redis;
  body: CheckinBody;
}): Promise<CheckinResult> {
  const { databaseUrl, redis, body } = args;
  const officeId = body.officeId.trim();
  if (!officeId) {
    return { ok: false, error: "معرّف المكتب مطلوب." };
  }

  await getActiveOffice(databaseUrl, officeId);
  const date = getCairoTodayYmd();

  if (body.mode === "restore") {
    const ticketId = body.ticketId.trim();
    if (!ticketId) return { ok: false, error: "معرّف التذكرة مطلوب." };
    const pool = getPool(databaseUrl);
    const ticketSnap = await pool.query(
      `SELECT * FROM queue_tickets WHERE id = $1`,
      [ticketId],
    );
    if (!ticketSnap.rowCount) {
      return {
        ok: false,
        error: "لم يُعثر على دورك لهذا اليوم. سجّل حضورك من جديد.",
      };
    }
    const ticket = ticketFromRow(ticketSnap.rows[0] as never);
    if (ticket.officeId !== officeId || ticket.queueDate !== date) {
      return {
        ok: false,
        error: "لم يُعثر على دورك لهذا اليوم. سجّل حضورك من جديد.",
      };
    }
    const requestSnap = await pool.query(`SELECT * FROM requests WHERE id = $1`, [
      ticket.requestId,
    ]);
    if (!requestSnap.rowCount) {
      return { ok: false, error: "الطلب المرتبط بالتذكرة غير موجود." };
    }
    const request = requestFromRow(requestSnap.rows[0] as never);
    return successPayload({ databaseUrl, redis, request, ticket });
  }

  if (body.mode === "quick") {
    const name = body.name.trim();
    const phone = body.phone.trim();
    const travelerStateId = body.travelerStateId.trim();
    if (!name || !phone || !travelerStateId) {
      return { ok: false, error: "يرجى إدخال الاسم ورقم الهاتف وحالة المسافر." };
    }
    const office = await getActiveOffice(databaseUrl, officeId);
    const accepted = new Set(getOfficeTravelerStateIds(office));
    if (!accepted.has(travelerStateId)) {
      return { ok: false, error: "حالة المسافر غير متاحة لهذا المكتب." };
    }
    const pool = getPool(databaseUrl);
    const stateLabel =
      (
        await pool.query<{ label_ar: string }>(
          `SELECT label_ar FROM traveler_states WHERE id = $1`,
          [travelerStateId],
        )
      ).rows[0]?.label_ar ?? travelerStateId;

    const createInput: CreateRequestInput = {
      governorateId: office.governorateId,
      officeId,
      type: "booking",
      travelerStateId,
      preferredDate: date,
      name,
      phone,
      details:
        body.details?.trim() ||
        `حالة المسافر: ${stateLabel}\nالتاريخ المطلوب: ${date}`,
      hasSpecialNeeds: body.hasSpecialNeeds === true,
      hasElderly: body.hasElderly === true,
    };

    let created;
    try {
      created = await createOfficeRequest({ databaseUrl, input: createInput });
    } catch (e) {
      const message = isApiError(e)
        ? e.message
        : e instanceof Error
          ? e.message
          : "تعذر إنشاء الطلب.";
      return { ok: false, error: message };
    }

    let ticket: QueueTicket;
    try {
      ticket = await createQueueTicket({
        databaseUrl,
        redis,
        requestId: created.id,
        requestNumber: created.requestNumber,
        officeId,
        createdFrom: "new_request",
        date,
      });
    } catch {
      return {
        ok: false,
        error:
          "تم حفظ الطلب، حاول تسجيل الحضور مرة أخرى بنفس رقم الهاتف لإصدار رقم الدور.",
      };
    }

    const request = await findRequestByNumberOrPhone(
      databaseUrl,
      created.requestNumber,
    );
    if (!request) {
      return { ok: false, error: "تم إنشاء الطلب لكن تعذر قراءته مرة أخرى." };
    }
    return successPayload({ databaseUrl, redis, request, ticket });
  }

  const lookup = body.lookup.trim();
  if (!lookup) {
    return { ok: false, error: "يرجى إدخال رقم الطلب أو الهاتف." };
  }

  const request = await findRequestByNumberOrPhone(databaseUrl, lookup);
  if (!request) {
    return { ok: false, needsQuickForm: true, lookupValue: lookup, error: "" };
  }
  if (request.officeId !== officeId) {
    return {
      ok: false,
      error: "هذا الطلب مسجّل لمكتب آخر. تأكد من مسح رمز QR الصحيح.",
    };
  }

  const ticket = await createQueueTicket({
    databaseUrl,
    redis,
    requestId: request.id,
    requestNumber: request.requestNumber,
    officeId,
    createdFrom: "existing_request",
    date,
  });

  return successPayload({ databaseUrl, redis, request, ticket });
}

/** Office-scoped request lookup (queue search helper). */
export async function findOfficeRequestByLookup(
  databaseUrl: string,
  officeId: string,
  value: string,
): Promise<OfficeRequest | null> {
  const lookup = normalizeRequestLookup(value);
  if (!lookup.raw) return null;
  const pool = getPool(databaseUrl);

  for (const requestNumber of lookup.requestNumbers) {
    const snap = await pool.query(
      `SELECT * FROM requests
       WHERE office_id = $1 AND request_number = $2 LIMIT 1`,
      [officeId, requestNumber],
    );
    if (snap.rowCount && snap.rowCount > 0) {
      return requestFromRow(snap.rows[0] as never);
    }
  }

  const tried = new Set<string>();
  for (const phone of lookup.phoneVariants) {
    if (!phone || tried.has(phone)) continue;
    tried.add(phone);
    const snap = await pool.query(
      `SELECT * FROM requests
       WHERE office_id = $1 AND phone = $2
       ORDER BY created_at DESC LIMIT 1`,
      [officeId, phone],
    );
    if (snap.rowCount && snap.rowCount > 0) {
      return requestFromRow(snap.rows[0] as never);
    }
  }
  return null;
}
