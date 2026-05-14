import * as XLSX from "xlsx";
import type { OfficeRequest } from "@/lib/office-requests/types";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  TRAVELER_CATEGORY_LABELS,
} from "@/lib/office-requests/types";

function travelerLabel(request: OfficeRequest): string {
  if (request.type !== "booking") return "—";
  if (!request.travelerCategory) return "بدون فئة";
  return TRAVELER_CATEGORY_LABELS[request.travelerCategory];
}

export function officeRequestsToXlsxBuffer(requests: OfficeRequest[]): Buffer {
  const rows = requests.map((r) => ({
    المعرف: r.id,
    المكتب: r.officeNameAr,
    "نوع الطلب": REQUEST_TYPE_LABELS[r.type],
    "فئة المسافر": travelerLabel(r),
    "تاريخ مفضل": r.preferredDate ?? "—",
    الحالة: REQUEST_STATUS_LABELS[r.status],
    الاسم: r.name,
    الهاتف: r.phone,
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
