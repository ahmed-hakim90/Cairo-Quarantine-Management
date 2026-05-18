import ExcelJS from "exceljs";
import { governorateLabelAr } from "@/data/governorates";
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

type ExportRow = {
  governorate: string;
  officeId: string;
  officeName: string;
  requestType: string;
  travelerCategory: string;
  preferredDate: string;
  status: string;
  name: string;
  phone: string;
  hasSpecialNeeds: string;
  hasElderly: string;
  details: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  lastWhatsappAt: string;
};

const columns: Partial<ExcelJS.Column>[] = [
  { header: "المحافظة", key: "governorate", width: 18 },
  { header: "معرف المكتب", key: "officeId", width: 24 },
  { header: "المكتب", key: "officeName", width: 28 },
  { header: "نوع الطلب", key: "requestType", width: 18 },
  { header: "فئة المسافر", key: "travelerCategory", width: 22 },
  { header: "تاريخ مفضل", key: "preferredDate", width: 16 },
  { header: "الحالة", key: "status", width: 18 },
  { header: "الاسم", key: "name", width: 24 },
  { header: "الهاتف", key: "phone", width: 18 },
  { header: "ذوي همم", key: "hasSpecialNeeds", width: 12 },
  { header: "كبار السن", key: "hasElderly", width: 12 },
  { header: "التفاصيل", key: "details", width: 40 },
  { header: "الملاحظات", key: "notes", width: 32 },
  { header: "تاريخ الإنشاء", key: "createdAt", width: 24 },
  { header: "تاريخ التحديث", key: "updatedAt", width: 24 },
  { header: "آخر واتساب", key: "lastWhatsappAt", width: 24 },
];

export async function officeRequestsToXlsxBuffer(
  requests: OfficeRequest[],
  travelerStateLabels: Record<string, string> = {},
): Promise<Buffer> {
  const rows: ExportRow[] = requests.map((r) => ({
    governorate: r.governorateId ? governorateLabelAr(r.governorateId) : "—",
    officeId: r.officeId,
    officeName: r.officeNameAr,
    requestType: REQUEST_TYPE_LABELS[r.type],
    travelerCategory: travelerLabel(r, travelerStateLabels),
    preferredDate: r.preferredDate ?? "—",
    status: REQUEST_STATUS_LABELS[r.status],
    name: r.name,
    phone: r.phone,
    hasSpecialNeeds: r.type === "booking" && r.hasSpecialNeeds ? "نعم" : "—",
    hasElderly: r.type === "booking" && r.hasElderly ? "نعم" : "—",
    details: r.details,
    notes: r.notes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    lastWhatsappAt: r.lastWhatsappAt ?? "—",
  }));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Cairo Quarantine Administration";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("الطلبات", {
    views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
  });
  sheet.columns = columns;
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { horizontal: "center" };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
