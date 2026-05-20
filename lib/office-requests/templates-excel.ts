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
import type { MessageTemplate } from "@/lib/office-requests/types";

export type TemplateImportRow = MessageTemplate & { sortOrder: number };

const COLUMNS: ColumnDef[] = [
  { key: "id", headerHints: ["معرف القالب", "id"] },
  { key: "title", headerHints: ["عنوان", "title"] },
  { key: "body", headerHints: ["نص الرسالة", "body", "رسالة"] },
  { key: "active", headerHints: ["نشط", "active"] },
];

const MUTABLE_FIELDS: CatalogFieldDef<MessageTemplate>[] = [
  { field: "title", labelAr: "العنوان", get: (t) => t.title },
  { field: "body", labelAr: "نص الرسالة", get: (t) => t.body },
  { field: "active", labelAr: "نشط", get: (t) => (t.active ? "نعم" : "لا") },
];

export function parseTemplatesSheet(
  sheet: ExcelJS.Worksheet,
): { rows: TemplateImportRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: TemplateImportRow[] = [];
  const seenIds = new Set<string>();

  if (!sheet || sheet.rowCount < 2) {
    return { rows, errors: ["الملف فارغ أو لا يحتوي على بيانات."] };
  }

  const cols = findSheetColumnIndexes(sheet.getRow(1), COLUMNS);
  if (!cols) {
    return {
      rows,
      errors: ["تعذّر العثور على أعمدة القوالب في الصف الأول."],
    };
  }

  let sortOrder = 0;
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const id = excelCellText(row.getCell(cols.id).value);
    const title = excelCellText(row.getCell(cols.title).value);
    const body = excelCellText(row.getCell(cols.body).value);

    if (!id && !title && !body) continue;
    if (!id) {
      errors.push(`صف ${r}: معرف القالب فارغ.`);
      continue;
    }
    if (seenIds.has(id)) {
      errors.push(`صف ${r}: تكرار معرف «${id}».`);
      continue;
    }
    seenIds.add(id);
    sortOrder += 1;

    rows.push({
      id,
      title: title || id,
      body,
      active: parseExcelBoolean(excelCellText(row.getCell(cols.active).value)),
      sortOrder,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("لم يُعثر على صفوف بيانات صالحة.");
  }

  return { rows, errors };
}

export async function parseTemplatesWorkbook(
  buffer: Buffer | ArrayBuffer,
): Promise<{ rows: TemplateImportRow[]; errors: string[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  const sheet = workbook.worksheets[0];
  if (!sheet) return { rows: [], errors: ["لا توجد ورقة في الملف."] };
  return parseTemplatesSheet(sheet);
}

export async function exportTemplatesXlsx(
  templates: MessageTemplate[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("قوالب واتساب", {
    views: [{ rightToLeft: true }],
  });
  sheet.columns = COLUMNS.map((c) => ({
    header: c.headerHints[0],
    key: c.key,
    width: c.key === "body" ? 48 : 20,
  }));
  templates.forEach((t, i) => {
    sheet.addRow({
      id: t.id,
      title: t.title,
      body: t.body,
      active: t.active ? "نعم" : "لا",
      sortOrder: i + 1,
    });
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function buildTemplatesTemplateXlsx(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("قوالب واتساب", {
    views: [{ rightToLeft: true }],
  });
  sheet.columns = COLUMNS.map((c) => ({
    header: c.headerHints[0],
    key: c.key,
    width: c.key === "body" ? 48 : 20,
  }));
  sheet.addRow({
    id: "example-template",
    title: "مثال",
    body: "مرحباً {name}",
    active: "نعم",
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function buildTemplatesImportPreview(
  rows: TemplateImportRow[],
  existing: MessageTemplate[],
  parseErrors: string[],
): CatalogImportPreview {
  return buildCatalogImportPreview<TemplateImportRow, MessageTemplate>({
    rows,
    existing,
    parseErrors,
    getLabel: (r) => `${r.title} (${r.id})`,
    getSortOrder: (r) => r.sortOrder,
    getMutableChanges: (current, row) =>
      diffRecordFields(current, row, MUTABLE_FIELDS),
    unknownMessage: (r) =>
      `القالب «${r.id}» غير مسجّل — لن يُنشأ سجل جديد.`,
  });
}
