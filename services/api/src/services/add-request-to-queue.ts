import type { Redis } from "@cqm/shared";
import { getPool } from "@cqm/shared";
import { ApiError } from "../lib/errors.js";
import {
  getCairoTodayYmd,
  queueTicketId,
  type OfficeRequest,
  type QueueTicket,
} from "../lib/domain.js";
import { ticketFromRow } from "../lib/db-mappers.js";
import { getRequestForAdminScope, type AdminScope } from "./admin-requests.js";
import { buildQueuePositionPublic } from "./queue-position.js";
import { createQueueTicket } from "./checkin.js";

export type AddRequestToQueueResult = {
  ok: true;
  requestId: string;
  ticketId: string;
  officeId: string;
  requestNumber: string;
  citizenName: string;
  queueNumber: number;
  aheadCount: number;
  alreadyInQueue: boolean;
  message: string;
};

export async function addRequestToQueueForAdmin(args: {
  databaseUrl: string;
  redis: Redis;
  scope: AdminScope;
  requestId: string;
  date?: string;
}): Promise<AddRequestToQueueResult> {
  const requestId = args.requestId.trim();
  if (!requestId) {
    throw new ApiError("bad_params", "رمز الطلب مفقود.", 400);
  }

  const request = await getRequestForAdminScope({
    databaseUrl: args.databaseUrl,
    scope: args.scope,
    id: requestId,
  });
  if (!request) {
    throw new ApiError("not_found", "الطلب غير موجود أو غير مصرح.", 404);
  }
  validateRequestForQueue(request);

  const queueDate = args.date?.trim() || getCairoTodayYmd();
  const existing = await findExistingQueueTicket({
    databaseUrl: args.databaseUrl,
    request,
    queueDate,
  });

  const ticket =
    existing ??
    (await createQueueTicket({
      databaseUrl: args.databaseUrl,
      redis: args.redis,
      requestId: request.id,
      requestNumber: request.requestNumber,
      officeId: request.officeId,
      createdFrom: "existing_request",
      date: queueDate,
    }));

  const position = await buildQueuePositionPublic({
    databaseUrl: args.databaseUrl,
    redis: args.redis,
    ticket,
  });
  const aheadCount = position.aheadCount ?? 0;

  return {
    ok: true,
    requestId: request.id,
    ticketId: ticket.id,
    officeId: request.officeId,
    requestNumber: ticket.requestNumber,
    citizenName: request.name,
    queueNumber: ticket.queueNumber,
    aheadCount,
    alreadyInQueue: Boolean(existing),
    message: queueAheadMessage(aheadCount),
  };
}

function validateRequestForQueue(request: OfficeRequest): void {
  if (request.type !== "booking") {
    throw new ApiError("bad_params", "يمكن إضافة الحجوزات فقط للطابور.", 400);
  }
  if (request.status === "completed" || request.status === "cancelled") {
    throw new ApiError(
      "bad_params",
      "لا يمكن إضافة طلب مكتمل أو ملغي للطابور.",
      400,
    );
  }
}

function queueAheadMessage(aheadCount: number): string {
  if (aheadCount <= 0) return "دوره الآن";
  if (aheadCount === 1) return "أمام المواطن شخص واحد";
  return `أمام المواطن ${aheadCount} أشخاص`;
}

async function findExistingQueueTicket(args: {
  databaseUrl: string;
  request: OfficeRequest;
  queueDate: string;
}): Promise<QueueTicket | null> {
  const ticketId = queueTicketId({
    requestId: args.request.id,
    officeId: args.request.officeId,
    queueDate: args.queueDate,
  });
  const pool = getPool(args.databaseUrl);
  const snap = await pool.query(`SELECT * FROM queue_tickets WHERE id = $1`, [
    ticketId,
  ]);
  if (!snap.rowCount) return null;
  return ticketFromRow(snap.rows[0] as never);
}
