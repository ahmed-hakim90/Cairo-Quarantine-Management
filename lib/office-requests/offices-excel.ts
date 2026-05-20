import ExcelJS from "exceljs";
import { EGYPT_GOVERNORATES } from "@/data/governorates";
import {
  excelCellText,
  findSheetColumnIndexes,
  parseExcelBoolean,
  type ColumnDef,
} from "@/lib/office-requests/catalog-excel-sheet";
import {
  buildCatalogImportPreview,
  diffRecordFields,
  type CatalogFieldDef,
  type CatalogFieldChange,
  type CatalogImportPreview,
} from "@/lib/office-requests/catalog-import-preview";
import type { Office, OfficeWorkingHours } from "@/lib/office-requests/types";

export type OfficeImportRow = Office & { sortOrder: number };

const COLUMNS: ColumnDef[] = [
  { key: "id", headerHints: ["معرف المكتب", "id"] },
  { key: "governorateId", headerHints: ["محافظة", "governorate"] },
  { key: "serialInGovernorate", headerHints: ["ترتيب م", "ترتيب"] },
  { key: "administrationAr", headerHints: ["الإدارة", "administration"] },
  { key: "nameAr", headerHints: ["اسم المكتب", "اسم"] },
  { key: "addressAr", headerHints: ["العنوان", "address"] },
  { key: "phone", headerHints: ["الهاتف", "phone"] },
  { key: "mapsUrl", headerHints: ["رابط الخريطة", "خريطة", "maps"] },
  { key: "service", headerHints: ["الخدمة", "service"] },
  { key: "active", headerHints: ["نشط", "active"] },
  { key: "dailyBookingCap", headerHints: ["حد الحجز", "حجز"] },
  { key: "travelerStateIds", headerHints: ["حالات المسافر", "traveler"] },
  { key: "wh24", headerHints: ["24 ساعة", "24"] },
  { key: "whFrom", headerHints: ["من", "from"] },
  { key: "whTo", headerHints: ["إلى", "to"] },
  { key: "whExcept", headerHints: ["استثناء ساعات", "استثناء"] },
];

const GOV_IDS = new Set(EGYPT_GOVERNORATES.map((g) => g.id));

function parseService(raw: string): Office["service"] | null {
  const v = raw.trim();
  if (v === "hajj_umrah_travelers" || v === "hajj_umrah_only") return v;
  if (v.includes("دولي") || v.includes("travelers")) return "hajj_umrah_travelers";
  if (v.includes("فقط") || v.includes("only")) return "hajj_umrah_only";
  return null;
}

function parseWorkingHoursFromCells(
  wh24: string,
  whFrom: string,
  whTo: string,
  whExcept: string,
): OfficeWorkingHours | undefined {
  if (parseExcelBoolean(wh24)) return { twentyFourSeven: true };
  const from = whFrom.trim();
  const to = whTo.trim();
  const exceptAr = whExcept.trim();
  if (!from && !to && !exceptAr) return undefined;
  const hours: OfficeWorkingHours = {};
  if (from) hours.from = from;
  if (to) hours.to = to;
  if (exceptAr) hours.exceptAr = exceptAr;
  return hours;
}

function workingHoursLabel(wh: OfficeWorkingHours | undefined): string {
  if (!wh) return "—";
  if (wh.twentyFourSeven) return "24 ساعة";
  const parts = [
    wh.from ? `من ${wh.from}` : "",
    wh.to ? `إلى ${wh.to}` : "",
    wh.exceptAr ? `استثناء: ${wh.exceptAr}` : "",
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}

function parseTravelerStateIds(raw: string): string[] | undefined {
  const ids = raw
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length > 0 ? [...new Set(ids)] : undefined;
}

function parseDailyCap(raw: string): number | null | undefined {
  if (!raw.trim()) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

function officeToExcelRow(o: Office, sortOrder: number): Record<string, string | number> {
  const wh = o.workingHours;
  return {
    id: o.id,
    governorateId: o.governorateId,
    serialInGovernorate: o.serialInGovernorate,
    administrationAr: o.administrationAr,
    nameAr: o.nameAr,
    addressAr: o.addressAr,
    phone: o.phone ?? "",
    mapsUrl: o.mapsUrl,
    service: o.service,
    active: o.active ? "نعم" : "لا",
    dailyBookingCap: o.dailyBookingCap ?? "",
    travelerStateIds: (o.travelerStateIds ?? []).join(", "),
    wh24: wh?.twentyFourSeven ? "نعم" : "لا",
    whFrom: wh?.from ?? "",
    whTo: wh?.to ?? "",
    whExcept: wh?.exceptAr ?? "",
    sortOrder,
  };
}

const MUTABLE_FIELDS: CatalogFieldDef<Office>[] = [
  { field: "addressAr", labelAr: "العنوان", get: (o) => o.addressAr },
  { field: "phone", labelAr: "الهاتف", get: (o) => o.phone ?? "" },
  { field: "mapsUrl", labelAr: "رابط الخريطة", get: (o) => o.mapsUrl },
  {
    field: "dailyBookingCap",
    labelAr: "حد الحجز اليومي",
    get: (o) =>
      o.dailyBookingCap != null ? String(o.dailyBookingCap) : "",
  },
  {
    field: "travelerStateIds",
    labelAr: "حالات المسافر",
    get: (o) => (o.travelerStateIds ?? []).join(", "),
  },
  { field: "active", labelAr: "نشط", get: (o) => (o.active ? "نعم" : "لا") },
  {
    field: "workingHours",
    labelAr: "ساعات العمل",
    get: (o) => workingHoursLabel(o.workingHours),
  },
];

function getMutableChanges(current: Office, row: Office): CatalogFieldChange[] {
  return diffRecordFields(current, row, MUTABLE_FIELDS);
}

export function parseOfficesSheet(
  sheet: ExcelJS.Worksheet,
): { rows: OfficeImportRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: OfficeImportRow[] = [];
  const seenIds = new Set<string>();

  if (!sheet || sheet.rowCount < 2) {
    return { rows, errors: ["الملف فارغ أو لا يحتوي على بيانات."] };
  }

  const cols = findSheetColumnIndexes(sheet.getRow(1), COLUMNS);
  if (!cols) {
    return {
      rows,
      errors: ["تعذّر العثور على أعمدة المكاتب في الصف الأول."],
    };
  }

  let sortOrder = 0;
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const id = excelCellText(row.getCell(cols.id).value);
    const nameAr = excelCellText(row.getCell(cols.nameAr).value);

    if (!id && !nameAr) continue;
    if (!id) {
      errors.push(`صف ${r}: معرف المكتب فارغ.`);
      continue;
    }
    if (seenIds.has(id)) {
      errors.push(`صف ${r}: تكرار معرف «${id}».`);
      continue;
    }
    seenIds.add(id);

    const gov = excelCellText(row.getCell(cols.governorateId).value).trim();
    if (gov && !GOV_IDS.has(gov)) {
      errors.push(`صف ${r}: محافظة غير صالحة «${gov}».`);
      continue;
    }

    const serviceRaw = excelCellText(row.getCell(cols.service).value);
    const service = parseService(serviceRaw);
    if (!service) {
      errors.push(`صف ${r}: خدمة غير صالحة «${serviceRaw}».`);
      continue;
    }

    sortOrder += 1;
    const serialRaw = excelCellText(row.getCell(cols.serialInGovernorate).value);
    const serialN = Number.parseInt(serialRaw, 10);

    rows.push({
      id,
      governorateId: gov || "cairo",
      serialInGovernorate:
        Number.isFinite(serialN) && serialN > 0 ? serialN : 9999,
      administrationAr: excelCellText(row.getCell(cols.administrationAr).value),
      nameAr: nameAr || id,
      addressAr: excelCellText(row.getCell(cols.addressAr).value),
      phone: excelCellText(row.getCell(cols.phone).value) || null,
      mapsUrl: excelCellText(row.getCell(cols.mapsUrl).value),
      service,
      active: parseExcelBoolean(excelCellText(row.getCell(cols.active).value)),
      dailyBookingCap: parseDailyCap(
        excelCellText(row.getCell(cols.dailyBookingCap).value),
      ),
      travelerStateIds: parseTravelerStateIds(
        excelCellText(row.getCell(cols.travelerStateIds).value),
      ),
      workingHours: parseWorkingHoursFromCells(
        excelCellText(row.getCell(cols.wh24).value),
        excelCellText(row.getCell(cols.whFrom).value),
        excelCellText(row.getCell(cols.whTo).value),
        excelCellText(row.getCell(cols.whExcept).value),
      ),
      sortOrder,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("لم يُعثر على صفوف بيانات صالحة.");
  }

  return { rows, errors };
}

export async function parseOfficesWorkbook(
  buffer: Buffer | ArrayBuffer,
): Promise<{ rows: OfficeImportRow[]; errors: string[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  const sheet = workbook.worksheets[0];
  if (!sheet) return { rows: [], errors: ["لا توجد ورقة في الملف."] };
  return parseOfficesSheet(sheet);
}

export async function exportOfficesXlsx(offices: Office[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("المكاتب", {
    views: [{ rightToLeft: true }],
  });
  sheet.columns = COLUMNS.map((c) => ({
    header: c.headerHints[0],
    key: c.key,
    width: 16,
  }));
  offices.forEach((o, i) => {
    sheet.addRow(officeToExcelRow(o, i + 1));
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function buildOfficesTemplateXlsx(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("المكاتب", {
    views: [{ rightToLeft: true }],
  });
  sheet.columns = COLUMNS.map((c) => ({
    header: c.headerHints[0],
    key: c.key,
    width: 16,
  }));
  sheet.addRow({
    id: "example-office",
    governorateId: "cairo",
    serialInGovernorate: 1,
    administrationAr: "إدارة مثال",
    nameAr: "مكتب مثال",
    addressAr: "عنوان",
    phone: "",
    mapsUrl: "https://maps.example.com",
    service: "hajj_umrah_travelers",
    active: "نعم",
    dailyBookingCap: "",
    travelerStateIds: "",
    wh24: "لا",
    whFrom: "08:00",
    whTo: "17:00",
    whExcept: "",
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function buildOfficesImportPreview(
  rows: OfficeImportRow[],
  existing: Office[],
  parseErrors: string[],
): CatalogImportPreview {
  return buildCatalogImportPreview<OfficeImportRow, Office>({
    rows,
    existing,
    parseErrors,
    getLabel: (r) => `${r.nameAr} (${r.id})`,
    getSortOrder: (r) => r.sortOrder,
    getMutableChanges,
    unknownMessage: (r) =>
      `المكتب «${r.id}» غير مسجّل — لن يُنشأ سجل جديد.`,
  });
}
