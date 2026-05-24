import { findRequestByNumberOrPhone } from "@/lib/queue/queue-service";

export type QueueBookingPreview = {
  id: string;
  requestNumber: string;
  officeNameAr: string;
  preferredDate: string;
  name: string;
};

export type QueueBookingPreviewResult =
  | { ok: true; preview: QueueBookingPreview }
  | { ok: false; reason: "not_found" | "wrong_office" | "not_booking" };

export async function loadQueueBookingPreview(args: {
  lookup: string;
  officeId: string;
}): Promise<QueueBookingPreviewResult> {
  const lookup = args.lookup.trim();
  const officeId = args.officeId.trim();
  if (!lookup || !officeId) {
    return { ok: false, reason: "not_found" };
  }

  const request = await findRequestByNumberOrPhone(lookup);
  if (!request) {
    return { ok: false, reason: "not_found" };
  }
  if (request.officeId !== officeId) {
    return { ok: false, reason: "wrong_office" };
  }
  if (request.type !== "booking") {
    return { ok: false, reason: "not_booking" };
  }

  return {
    ok: true,
    preview: {
      id: request.id,
      requestNumber: request.requestNumber,
      officeNameAr: request.officeNameAr,
      preferredDate: request.preferredDate ?? "",
      name: request.name,
    },
  };
}
