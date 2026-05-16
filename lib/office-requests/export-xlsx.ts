import * as XLSX from "xlsx";
import type { OfficeRequest } from "@/lib/office-requests/types";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  TRAVELER_CATEGORY_LABELS,
} from "@/lib/office-requests/types";
import { effectiveTravelerStateIdOnRequest } from "@/lib/office-requests/office-traveler-state";

function travelerLabel(
  request: OfficeRequest,
  stateLabels: Record<string, string>,
): string {
  if (request.type !== "booking") return "—";
  const id = effectiveTravelerStateIdOnRequest(request);
  if (!id) return "بدون فئة";
  if (stateLabels[id]) return stateLabels[id];
  if (
    request.travelerCategory &&
    TRAVELER_CATEGORY_LABELS[request.travelerCategory]
  ) {
    return TRAVELER_CATEGORY_LABELS[request.travelerCategory];
  }
  return id;
}

export function officeRequestsToXlsxBuffer(
  requests: OfficeRequest[],
  travelerStateLabels: Record<string, string> = {},
): Buffer {
  const rows = requests.map((r) => ({
    "معرف المكتب": r.officeId,
    المكتب: r.officeNameAr,
    "نوع الطلب": REQUEST_TYPE_LABELS[r.type],
    "فئة المسافر": travelerLabel(r, travelerStateLabels),
    "تاريخ مفضل": r.preferredDate ?? "—",
    الحالة: REQUEST_STATUS_LABELS[r.status],
    الاسم: r.name,
    الهاتف: r.phone,
    "ذوي همم":
      r.type === "booking" && r.hasSpecialNeeds ? "نعم" : "—",
    التفاصيل: r.details,
    الملاحظات: r.notes,
    "تاريخ الإنشاء": r.createdAt,
    "تاريخ التحديث": r.updatedAt,
    "آخر واتساب": r.lastWhatsappAt ?? "—",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "الطلبات");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
