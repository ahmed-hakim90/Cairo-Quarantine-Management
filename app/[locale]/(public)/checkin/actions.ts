"use server";

import { headers } from "next/headers";
import { rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { checkUnifiedRateLimit } from "@/lib/rate-limit-unified";
import {
  assertActiveOffice,
  checkExistingTodayQueue,
  createQuickRequestAndQueue,
  createQueueTicket,
  findRequestByNumberOrPhone,
  getTodayKey,
  restoreOfficeCheckinByTicketId,
} from "@/lib/queue/queue-service";
import { getOfficeTravelerStateIds } from "@/lib/office-requests/office-traveler-state";
import { listTravelerStatesForPublicBooking } from "@/lib/office-requests/store";
import type { OfficeRequest } from "@/lib/office-requests/types";
import { getQueuePositionPublic } from "@/lib/queue/queue-position";
import type { QueuePositionPublic, QueueTicket } from "@/lib/queue/types";

export type CheckinState =
  | {
      ok: true;
      ticket: QueueTicket;
      citizenName?: string;
      passToken?: string;
      requestType?: OfficeRequest["type"];
      requestId?: string;
      officeNameAr?: string;
      preferredDate?: string;
      lookup?: string;
      initialPosition?: QueuePositionPublic;
    }
  | {
      ok: false;
      error?: string;
      needsQuickForm?: boolean;
      lookupValue?: string;
    };

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function assertCheckinRateLimit(scope: string): Promise<string | null> {
  const headerList = await headers();
  const rateLimit = await checkUnifiedRateLimit({
    scope,
    key: rateLimitKeyFromHeaders(headerList, scope),
    limit: 20,
    windowMs: 10 * 60_000,
  });
  if (!rateLimit.allowed) {
    return "تم تجاوز عدد المحاولات. انتظر قليلاً ثم حاول مرة أخرى.";
  }
  return null;
}

async function successFromRequest(
  request: OfficeRequest,
  ticket: QueueTicket,
): Promise<Extract<CheckinState, { ok: true }>> {
  const initialPosition = await getQueuePositionPublic(ticket.id);
  return {
    ok: true,
    ticket,
    citizenName: request.name,
    requestId: request.id,
    requestType: request.type,
    officeNameAr: request.officeNameAr,
    ...(request.preferredDate ? { preferredDate: request.preferredDate } : {}),
    ...(request.passToken ? { passToken: request.passToken } : {}),
    ...(initialPosition ? { initialPosition } : {}),
  };
}

export async function checkinLookupAction(
  _prev: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const officeId = formValue(formData, "officeId");
  const lookup = formValue(formData, "lookup");
  if (!officeId || !lookup) {
    return { ok: false, error: "يرجى إدخال رقم الطلب أو الهاتف." };
  }

  try {
    await assertActiveOffice(officeId);
    const request = await findRequestByNumberOrPhone(lookup);
    if (!request) {
      return { ok: false, needsQuickForm: true, lookupValue: lookup };
    }
    if (request.officeId !== officeId) {
      return {
        ok: false,
        error: "هذا الطلب مسجّل لمكتب آخر. تأكد من مسح رمز QR الصحيح.",
      };
    }

    const date = getTodayKey();
    const existing = await checkExistingTodayQueue(request.id, officeId, date);
    const ticket =
      existing ??
      (await createQueueTicket({
        requestId: request.id,
        requestNumber: request.requestNumber,
        officeId,
        createdFrom: "existing_request",
        date,
      }));

    return { ...(await successFromRequest(request, ticket)), lookup };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "تعذر تسجيل الحضور.",
    };
  }
}

export async function checkinRestoreAction(
  officeId: string,
  ticketId: string,
): Promise<CheckinState> {
  if (!officeId.trim() || !ticketId.trim()) {
    return { ok: false };
  }

  try {
    await assertActiveOffice(officeId);
    const restored = await restoreOfficeCheckinByTicketId(officeId, ticketId);
    if (!restored) {
      return {
        ok: false,
        error: "لم يُعثر على دورك لهذا اليوم. سجّل حضورك من جديد.",
      };
    }
    return successFromRequest(restored.request, restored.ticket);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "تعذر استعادة جلسة الحضور.",
    };
  }
}

export async function checkinQuickAction(
  _prev: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const rateLimited = await assertCheckinRateLimit("checkin-quick");
  if (rateLimited) return { ok: false, error: rateLimited };

  const officeId = formValue(formData, "officeId");
  const name = formValue(formData, "name");
  const phone = formValue(formData, "phone") || formValue(formData, "lookup");
  const travelerStateId = formValue(formData, "travelerStateId");
  const hasSpecialNeeds = formData.get("hasSpecialNeeds") === "on";
  const hasElderly = formData.get("hasElderly") === "on";
  const details = formValue(formData, "details");

  if (!officeId || !name || !phone || !travelerStateId) {
    return { ok: false, error: "يرجى إدخال الاسم ورقم الهاتف وحالة المسافر." };
  }

  try {
    const office = await assertActiveOffice(officeId);
    const acceptedIds = new Set(getOfficeTravelerStateIds(office));
    if (!acceptedIds.has(travelerStateId)) {
      return { ok: false, error: "حالة المسافر غير متاحة لهذا المكتب." };
    }
    const travelerStates = await listTravelerStatesForPublicBooking();
    const travelerStateLabel =
      travelerStates.find((s) => s.id === travelerStateId)?.labelAr ??
      travelerStateId;
    const { request, ticket } = await createQuickRequestAndQueue({
      officeId,
      name,
      phone,
      travelerStateId,
      travelerStateLabel,
      hasSpecialNeeds,
      hasElderly,
      details,
    });
    return { ...(await successFromRequest(request, ticket)), lookup: phone };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "تعذر إنشاء الطلب وتسجيل الحضور.",
    };
  }
}
