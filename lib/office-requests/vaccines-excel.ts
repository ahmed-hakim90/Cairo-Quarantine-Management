import ExcelJS from "exceljs";
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
  type CatalogImportPreview,
} from "@/lib/office-requests/catalog-import-preview";
import type {
  VaccineCatalogEntry,
  VaccineUserCategory,
} from "@/lib/office-requests/types";

export type VaccineImportRow = VaccineCatalogEntry & { sortOrder: number };

const COLUMNS: ColumnDef[] = [
  { key: "id", headerHints: ["معرف اللقاح", "id"] },
  { key: "category", headerHints: ["الفئة", "category"] },
  { key: "nameAr", headerHints: ["اسم عربي", "name ar"] },
  { key: "nameEn", headerHints: ["اسم إنجليزي", "english"] },
  { key: "nameFr", headerHints: ["اسم فرنسي", "فرنسي", "french"] },
  { key: "priceEgp", headerHints: ["سعر", "price"] },
  { key: "free", headerHints: ["مجاني", "free"] },
  { key: "sortOrder", headerHints: ["ترتيب", "sort"] },
  { key: "active", headerHints: ["نشط", "active"] },
];

const CATEGORIES: VaccineUserCategory[] = [
  "international",
  "hajj",
  "umrah",
  "citizen",
];

function isCategory(value: string): value is VaccineUserCategory {
  return (CATEGORIES as string[]).includes(value);
}

function parsePrice(raw: string, free: boolean): number | null {
  if (free) return null;
  if (!raw.trim()) return null;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function vaccineToRow(v: VaccineCatalogEntry, sortOrder: number): Record<string, string | number> {
  return {
    id: v.id,
    category: v.category,
    nameAr: v.nameAr,
    nameEn: v.nameEn,
    nameFr: v.nameFr ?? v.nameEn,
    priceEgp: v.free ? "" : (v.priceEgp ?? ""),
    free: v.free ? "نعم" : "لا",
    sortOrder: v.sortOrder || sortOrder,
    active: v.active ? "نعم" : "لا",
  };
}

const MUTABLE_FIELDS: CatalogFieldDef<VaccineCatalogEntry>[] = [
  { field: "nameAr", labelAr: "اسم عربي", get: (v) => v.nameAr },
  { field: "nameEn", labelAr: "اسم إنجليزي", get: (v) => v.nameEn },
  {
    field: "nameFr",
    labelAr: "اسم فرنسي",
    get: (v) => v.nameFr ?? v.nameEn,
  },
  {
    field: "priceEgp",
    labelAr: "السعر",
    get: (v) => (v.free ? "مجاني" : String(v.priceEgp ?? "")),
  },
  { field: "free", labelAr: "مجاني", get: (v) => (v.free ? "نعم" : "لا") },
  { field: "sortOrder", labelAr: "الترتيب", get: (v) => String(v.sortOrder) },
  { field: "active", labelAr: "نشط", get: (v) => (v.active ? "نعم" : "لا") },
];

export function parseVaccinesSheet(
  sheet: ExcelJS.Worksheet,
): { rows: VaccineImportRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: VaccineImportRow[] = [];
  const seenIds = new Set<string>();

  if (!sheet || sheet.rowCount < 2) {
    return { rows, errors: ["الملف فارغ أو لا يحتوي على بيانات."] };
  }

  const cols = findSheetColumnIndexes(sheet.getRow(1), COLUMNS);
  if (!cols) {
    return {
      rows,
      errors: ["تعذّر العثور على أعمدة اللقاحات في الصف الأول."],
    };
  }

  let sortOrder = 0;
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const id = excelCellText(row.getCell(cols.id).value);
    const categoryRaw = excelCellText(row.getCell(cols.category).value);
    const nameAr = excelCellText(row.getCell(cols.nameAr).value);
    const nameEn = excelCellText(row.getCell(cols.nameEn).value);

    if (!id && !nameAr && !nameEn) continue;
    if (!id) {
      errors.push(`صف ${r}: معرف اللقاح فارغ.`);
      continue;
    }
    if (!isCategory(categoryRaw)) {
      errors.push(`صف ${r}: فئة غير صالحة «${categoryRaw}».`);
      continue;
    }
    if (seenIds.has(id)) {
      errors.push(`صف ${r}: تكرار معرف «${id}».`);
      continue;
    }
    seenIds.add(id);

    sortOrder += 1;
    const free = parseExcelBoolean(excelCellText(row.getCell(cols.free).value));
    const sortRaw = excelCellText(row.getCell(cols.sortOrder).value);
    const sortN = Number(sortRaw);
    rows.push({
      id,
      category: categoryRaw,
      nameAr: nameAr || id,
      nameEn: nameEn || id,
      nameFr: excelCellText(row.getCell(cols.nameFr).value) || nameEn || id,
      priceEgp: parsePrice(excelCellText(row.getCell(cols.priceEgp).value), free),
      free,
      sortOrder: Number.isFinite(sortN) ? sortN : sortOrder,
      active: parseExcelBoolean(excelCellText(row.getCell(cols.active).value)),
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("لم يُعثر على صفوف بيانات صالحة.");
  }

  return { rows, errors };
}

export async function parseVaccinesWorkbook(
  buffer: Buffer | ArrayBuffer,
): Promise<{ rows: VaccineImportRow[]; errors: string[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  const sheet = workbook.worksheets[0];
  if (!sheet) return { rows: [], errors: ["لا توجد ورقة في الملف."] };
  return parseVaccinesSheet(sheet);
}

export async function exportVaccinesXlsx(
  vaccines: VaccineCatalogEntry[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("التطعيمات", {
    views: [{ rightToLeft: true }],
  });
  sheet.columns = COLUMNS.map((c) => ({
    header: c.headerHints[0],
    key: c.key,
    width: 18,
  }));
  vaccines.forEach((v, i) => {
    sheet.addRow(vaccineToRow(v, i + 1));
  });
  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.from(raw);
}

export async function buildVaccinesTemplateXlsx(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("التطعيمات", {
    views: [{ rightToLeft: true }],
  });
  sheet.columns = COLUMNS.map((c) => ({
    header: c.headerHints[0],
    key: c.key,
    width: 18,
  }));
  sheet.addRow({
    id: "example-vaccine",
    category: "international",
    nameAr: "مثال",
    nameEn: "Example",
    nameFr: "Exemple",
    priceEgp: 100,
    free: "لا",
    sortOrder: 1,
    active: "نعم",
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function buildVaccinesImportPreview(
  rows: VaccineImportRow[],
  existing: VaccineCatalogEntry[],
  parseErrors: string[],
): CatalogImportPreview {
  return buildCatalogImportPreview<VaccineImportRow, VaccineCatalogEntry>({
    rows,
    existing,
    parseErrors,
    getLabel: (r) => `${r.nameAr} (${r.id})`,
    getSortOrder: (r) => r.sortOrder,
    getMutableChanges: (current, row) =>
      diffRecordFields(current, row, MUTABLE_FIELDS),
    unknownMessage: (r) =>
      `اللقاح «${r.id}» غير مسجّل — لن يُنشأ سجل جديد.`,
  });
}
