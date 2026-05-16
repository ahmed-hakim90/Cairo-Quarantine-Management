import type { OfficeRequest } from "@/lib/office-requests/types";
import { effectiveTravelerStateIdOnRequest } from "@/lib/office-requests/office-traveler-state";

const AUTO_DETAILS_PATTERN =
  /^حالة المسافر: .+\nالتاريخ المطلوب: \d{4}-\d{2}-\d{2}$/;

/** نص التفاصيل المُولَّد تلقائياً عند ترك ملاحظات الحجز فارغة. */
export function bookingAutoDetailsText(
  travelerStateLabel: string,
  preferredDate: string,
): string {
  return `حالة المسافر: ${travelerStateLabel}\nالتاريخ المطلوب: ${preferredDate}`;
}

/** ملاحظات العميل فقط؛ يُستبعد النص التلقائي من حالة المسافر والتاريخ. */
export function bookingUserNotes(
  request: OfficeRequest,
  labelById: Record<string, string>,
): string | null {
  if (request.type !== "booking") return null;
  const details = request.details.trim();
  if (!details) return null;

  if (AUTO_DETAILS_PATTERN.test(details)) return null;

  const tid = effectiveTravelerStateIdOnRequest(request);
  const label = tid ? labelById[tid] ?? tid : "";
  if (label && request.preferredDate) {
    const auto = bookingAutoDetailsText(label, request.preferredDate);
    if (details === auto) return null;
  }

  return details;
}
