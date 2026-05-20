"use server";

import { headers } from "next/headers";
import {
  checkinActionCopy,
  localizeCheckinError,
} from "@/lib/i18n/checkin-copy";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
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

function localeFromForm(formData: FormData): Locale {
  const raw = formValue(formData, "locale");
  return isLocale(raw) ? raw : defaultLocale;
}

async function assertCheckinRateLimit(
  scope: string,
  locale: Locale,
): Promise<string | null> {
  const headerList = await headers();
  const rateLimit = await checkUnifiedRateLimit({
    scope,
    key: rateLimitKeyFromHeaders(headerList, scope),
    limit: 20,
    windowMs: 10 * 60_000,
  });
  if (!rateLimit.allowed) {
    return checkinActionCopy[locale].rateLimited;
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
  const locale = localeFromForm(formData);
  const t = checkinActionCopy[locale];
  const officeId = formValue(formData, "officeId");
  const lookup = formValue(formData, "lookup");
  if (!officeId || !lookup) {
    return { ok: false, error: t.lookupRequired };
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
        error: t.wrongOffice,
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
      error: localizeCheckinError(
        locale,
        e instanceof Error ? e.message : undefined,
        "checkinFailed",
      ),
    };
  }
}

export async function checkinRestoreAction(
  officeId: string,
  ticketId: string,
  locale: Locale = defaultLocale,
): Promise<CheckinState> {
  const t = checkinActionCopy[locale];
  if (!officeId.trim() || !ticketId.trim()) {
    return { ok: false };
  }

  try {
    await assertActiveOffice(officeId);
    const restored = await restoreOfficeCheckinByTicketId(officeId, ticketId);
    if (!restored) {
      return {
        ok: false,
        error: t.restoreFailed,
      };
    }
    return successFromRequest(restored.request, restored.ticket);
  } catch (e) {
    return {
      ok: false,
      error: localizeCheckinError(
        locale,
        e instanceof Error ? e.message : undefined,
        "restoreSessionFailed",
      ),
    };
  }
}

export async function checkinQuickAction(
  _prev: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const locale = localeFromForm(formData);
  const t = checkinActionCopy[locale];
  const rateLimited = await assertCheckinRateLimit("checkin-quick", locale);
  if (rateLimited) return { ok: false, error: rateLimited };

  const officeId = formValue(formData, "officeId");
  const name = formValue(formData, "name");
  const phone = formValue(formData, "phone") || formValue(formData, "lookup");
  const travelerStateId = formValue(formData, "travelerStateId");
  const hasSpecialNeeds = formData.get("hasSpecialNeeds") === "on";
  const hasElderly = formData.get("hasElderly") === "on";
  const details = formValue(formData, "details");

  if (!officeId || !name || !phone || !travelerStateId) {
    return { ok: false, error: t.quickRequired };
  }

  try {
    const office = await assertActiveOffice(officeId);
    const acceptedIds = new Set(getOfficeTravelerStateIds(office));
    if (!acceptedIds.has(travelerStateId)) {
      return { ok: false, error: t.travelerStateUnavailable };
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
      error: localizeCheckinError(
        locale,
        e instanceof Error ? e.message : undefined,
        "quickFailed",
      ),
    };
  }
}
