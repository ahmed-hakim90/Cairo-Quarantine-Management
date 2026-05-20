import ExcelJS from "exceljs";
import type { DestinationCountryImportResult } from "@/lib/office-requests/types";

export type DestinationCountryImportRow = {
  id: string;
  nameEn: string;
  nameAr: string;
  requirementsAr: string;
  sortOrder: number;
};

const COUNTRY_HEADER_HINTS = ["اسم الدولة", "الدولة", "country"];
const REQUIREMENTS_HEADER_HINTS = [
  "متطلبات التطعيم",
  "متطلبات",
  "requirements",
];

export function slugifyCountryId(nameEn: string): string {
  return nameEn
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseCountryLabel(cell: string): {
  nameEn: string;
  nameAr: string;
  id: string;
} | null {
  const raw = cell.trim();
  if (!raw) return null;

  const parts = raw.split(/\s+[-–—]\s+/);
  const nameEn = parts[0]?.trim() ?? "";
  const nameAr = parts.slice(1).join(" - ").trim() || nameEn;
  if (!nameEn) return null;

  const id = slugifyCountryId(nameEn);
  if (!id) return null;

  return { nameEn, nameAr, id };
}

function normalizeHeader(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text: string }).text).trim().toLowerCase();
  }
  return String(value).trim().toLowerCase();
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text: string }).text).trim();
  }
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function headerMatches(header: string, hints: string[]): boolean {
  const h = header.toLowerCase();
  return hints.some((hint) => h.includes(hint.toLowerCase()));
}

export function findColumnIndexes(
  headerRow: ExcelJS.Row,
): { countryCol: number; requirementsCol: number } | null {
  let countryCol = 0;
  let requirementsCol = 0;

  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const h = normalizeHeader(cell.value);
    if (headerMatches(h, COUNTRY_HEADER_HINTS)) countryCol = col;
    if (headerMatches(h, REQUIREMENTS_HEADER_HINTS)) requirementsCol = col;
  });

  if (countryCol > 0 && requirementsCol > 0) {
    return { countryCol, requirementsCol };
  }
  return null;
}

export function parseDestinationCountriesSheet(
  sheet: ExcelJS.Worksheet,
): { rows: DestinationCountryImportRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: DestinationCountryImportRow[] = [];
  const seenIds = new Set<string>();

  if (!sheet || sheet.rowCount < 2) {
    return { rows, errors: ["الملف فارغ أو لا يحتوي على بيانات."] };
  }

  const headerRow = sheet.getRow(1);
  const cols = findColumnIndexes(headerRow);
  if (!cols) {
    return {
      rows,
      errors: [
        "تعذّر العثور على أعمدة «اسم الدولة» و«متطلبات التطعيم» في الصف الأول.",
      ],
    };
  }

  let sortOrder = 0;
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const countryCell = cellText(row.getCell(cols.countryCol).value);
    const requirementsCell = cellText(row.getCell(cols.requirementsCol).value);

    if (!countryCell && !requirementsCell) continue;
    if (!countryCell) {
      errors.push(`صف ${r}: اسم الدولة فارغ.`);
      continue;
    }

    const parsed = parseCountryLabel(countryCell);
    if (!parsed) {
      errors.push(`صف ${r}: تعذّر تحليل اسم الدولة «${countryCell}».`);
      continue;
    }

    if (seenIds.has(parsed.id)) {
      errors.push(`صف ${r}: تكرار للدولة «${parsed.nameEn}».`);
      continue;
    }
    seenIds.add(parsed.id);

    sortOrder += 1;
    rows.push({
      id: parsed.id,
      nameEn: parsed.nameEn,
      nameAr: parsed.nameAr,
      requirementsAr: requirementsCell || "لا يوجد",
      sortOrder,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("لم يُعثر على صفوف بيانات صالحة.");
  }

  return { rows, errors };
}

export async function parseDestinationCountriesWorkbook(
  buffer: Buffer | ArrayBuffer,
): Promise<{ rows: DestinationCountryImportRow[]; errors: string[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { rows: [], errors: ["لا توجد ورقة في الملف."] };
  }
  return parseDestinationCountriesSheet(sheet);
}

export async function buildDestinationCountriesTemplateXlsx(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("متطلبات الدول", {
    views: [{ rightToLeft: true }],
  });
  sheet.columns = [
    { header: "اسم الدولة", key: "country", width: 42 },
    { header: "متطلبات التطعيم", key: "requirements", width: 36 },
  ];
  sheet.addRow({
    country: "EGYPT - مصر",
    requirements: "لا يوجد",
  });
  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.from(raw);
}

export type DestinationCountryImportMode = "bootstrap" | "update";

export function mergeImportParseErrors(
  parseErrors: string[],
  result: DestinationCountryImportResult,
): DestinationCountryImportResult {
  if (parseErrors.length === 0) return result;
  return {
    ...result,
    errors: [...parseErrors, ...result.errors],
  };
}
