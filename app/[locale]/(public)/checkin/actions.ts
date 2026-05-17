"use server";

import {
  assertActiveOffice,
  checkExistingTodayQueue,
  createQuickRequestAndQueue,
  createQueueTicket,
  findRequestByNumberOrPhone,
  getTodayKey,
} from "@/lib/queue/queue-service";
import { getOfficeTravelerStateIds } from "@/lib/office-requests/office-traveler-state";
import { listTravelerStatesForPublicBooking } from "@/lib/office-requests/store";
import type { QueueTicket } from "@/lib/queue/types";

export type CheckinState =
  | {
      ok: true;
      ticket: QueueTicket;
      citizenName?: string;
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

    return {
      ok: true,
      ticket,
      citizenName: request.name,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "تعذر تسجيل الحضور.",
    };
  }
}

export async function checkinQuickAction(
  _prev: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const officeId = formValue(formData, "officeId");
  const name = formValue(formData, "name");
  const phone = formValue(formData, "phone") || formValue(formData, "lookup");
  const travelerStateId = formValue(formData, "travelerStateId");
  const hasSpecialNeeds = formData.get("hasSpecialNeeds") === "on";
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
      details,
    });
    return {
      ok: true,
      ticket,
      citizenName: request.name,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "تعذر إنشاء الطلب وتسجيل الحضور.",
    };
  }
}
