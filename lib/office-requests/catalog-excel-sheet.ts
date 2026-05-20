import type ExcelJS from "exceljs";

export function normalizeExcelHeader(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text: string }).text).trim().toLowerCase();
  }
  return String(value).trim().toLowerCase();
}

export function excelCellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text: string }).text).trim();
  }
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

export function headerMatches(header: string, hints: string[]): boolean {
  const h = header.toLowerCase();
  return hints.some((hint) => h.includes(hint.toLowerCase()));
}

export type ColumnDef = {
  key: string;
  headerHints: string[];
};

export function findSheetColumnIndexes(
  headerRow: ExcelJS.Row,
  columns: ColumnDef[],
): Record<string, number> | null {
  const indexes: Record<string, number> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const h = normalizeExcelHeader(cell.value);
    for (const colDef of columns) {
      if (headerMatches(h, colDef.headerHints)) {
        indexes[colDef.key] = col;
      }
    }
  });
  for (const colDef of columns) {
    if (!indexes[colDef.key]) return null;
  }
  return indexes;
}

export function parseExcelBoolean(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (["نعم", "yes", "1", "true", "y"].includes(v)) return true;
  if (["لا", "no", "0", "false", "n", ""].includes(v)) return false;
  return v !== "";
}
