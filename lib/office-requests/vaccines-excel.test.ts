import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  buildVaccinesImportPreview,
  parseVaccinesSheet,
} from "@/lib/office-requests/vaccines-excel";
import type { VaccineCatalogEntry } from "@/lib/office-requests/types";

async function sheetFromRows(rows: string[][]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("test");
  sheet.addRow([
    "معرف اللقاح",
    "الفئة",
    "اسم عربي",
    "اسم إنجليزي",
    "اسم فرنسي",
    "سعر جنيه",
    "مجاني",
    "ترتيب",
    "نشط",
  ]);
  for (const row of rows) sheet.addRow(row);
  return sheet;
}

describe("vaccines excel", () => {
  it("parses and previews updates", async () => {
    const sheet = await sheetFromRows([
      [
        "v1",
        "international",
        "لقاح",
        "Vaccine",
        "Vaccine",
        "50",
        "لا",
        "1",
        "نعم",
      ],
    ]);
    const { rows, errors } = parseVaccinesSheet(sheet);
    expect(errors).toEqual([]);
    expect(rows[0]?.id).toBe("v1");

    const existing: VaccineCatalogEntry[] = [
      {
        id: "v1",
        category: "international",
        nameAr: "لقاح",
        nameEn: "Vaccine",
        priceEgp: 10,
        free: false,
        sortOrder: 1,
        active: true,
      },
    ];
    const preview = buildVaccinesImportPreview(rows, existing, []);
    expect(preview.summary.update).toBe(1);
    expect(preview.updates[0]?.changes?.some((c) => c.field === "priceEgp")).toBe(
      true,
    );
  });
});
