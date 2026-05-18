"use server";

import { revalidatePath } from "next/cache";
import { isVpsApiEnabled } from "@/lib/api/vps-config";
import { vpsCompleteQueueTicket } from "@/lib/api/vps-client";
import { adminCanAccessOffice } from "@/lib/office-requests/admin-access";
import { getAdminSession } from "@/lib/office-requests/session";
import {
  completeQueueTicket,
  findOfficeRequestByLookup,
  findQueueTicketForOfficeDay,
  normalizeRequestLookup,
} from "@/lib/queue/queue-service";
import type { QueueTicketWithRequest } from "@/lib/queue/types";

export type QueuePanelState =
  | { ok: true; ticket: QueueTicketWithRequest }
  | { ok: false; error?: string; ticket?: null };

async function assertQueueAccess(officeId: string) {
  const session = await getAdminSession();
  if (!session) throw new Error("يجب تسجيل الدخول.");
  if (!adminCanAccessOffice(session.profile, officeId)) {
    throw new Error("غير مصرح لهذا المكتب.");
  }
  return session;
}

export async function searchTicketAction(
  _prev: QueuePanelState,
  formData: FormData,
): Promise<QueuePanelState> {
  const officeId = String(formData.get("officeId") ?? "").trim();
  const queueDate = String(formData.get("queueDate") ?? "").trim();
  const search = String(formData.get("search") ?? "").trim();

  try {
    await assertQueueAccess(officeId);
    if (!search) {
      return { ok: false, error: "أدخل رقم الدور أو رقم الطلب أو الهاتف." };
    }
    const ticket = await findQueueTicketForOfficeDay({
      officeId,
      date: queueDate,
      value: search,
    });
    if (!ticket) {
      const lookup = normalizeRequestLookup(search);
      const hasPhoneLookup = lookup.phoneVariants.some(
        (phone) => phone.replace(/\D/g, "").length >= 8,
      );
      if (hasPhoneLookup) {
        const request = await findOfficeRequestByLookup(officeId, search);
        if (request) {
          return {
            ok: false,
            error: "يوجد طلب بهذا الرقم في المكتب لكن لم يسجّل حضوراً في طابور اليوم.",
          };
        }
      }
      return {
        ok: false,
        error: "لا يوجد دور في طابور اليوم بهذا الرقم أو الطلب أو الهاتف.",
      };
    }
    return { ok: true, ticket };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "تعذر البحث.",
    };
  }
}

export async function completeTicketAction(
  _prev: QueuePanelState,
  formData: FormData,
): Promise<QueuePanelState> {
  const officeId = String(formData.get("officeId") ?? "").trim();
  const ticketId = String(formData.get("ticketId") ?? "").trim();

  try {
    await assertQueueAccess(officeId);
    const updated = isVpsApiEnabled()
      ? await vpsCompleteQueueTicket(ticketId)
      : await completeQueueTicket(ticketId);
    const ticket = await findQueueTicketForOfficeDay({
      officeId,
      date: updated.queueDate,
      value: String(updated.queueNumber),
    });
    if (!ticket) return { ok: false, error: "تعذر قراءة التذكرة بعد التحديث." };
    const locale = String(formData.get("locale") ?? "ar").trim() || "ar";
    revalidatePath(`/${locale}/office-dashboard/${officeId}/queue`);
    revalidatePath(`/${locale}/admin/requests`);
    if (ticket.request?.id) {
      revalidatePath(`/${locale}/admin/requests/${ticket.request.id}`);
    }
    return { ok: true, ticket };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "تعذر إتمام الدور.",
    };
  }
}
