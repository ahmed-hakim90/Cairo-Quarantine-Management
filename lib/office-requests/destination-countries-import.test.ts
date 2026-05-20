import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import type { DestinationCountry } from "@/lib/office-requests/types";
import {
  buildDestinationCountriesExportXlsx,
  buildDestinationCountriesImportPreview,
  buildDestinationCountriesTemplateXlsx,
  destinationCountryExcelLabel,
  parseCountryLabel,
  parseDestinationCountriesSheet,
  slugifyCountryId,
} from "@/lib/office-requests/destination-countries-import";

describe("slugifyCountryId", () => {
  it("normalizes English country names", () => {
    expect(slugifyCountryId("AFGHANISTAN")).toBe("afghanistan");
    expect(slugifyCountryId("  Antigua and Barbuda  ")).toBe("antigua-and-barbuda");
  });
});

describe("parseCountryLabel", () => {
  it("parses EN - AR format", () => {
    const parsed = parseCountryLabel("EGYPT - مصر");
    expect(parsed).toEqual({
      id: "egypt",
      nameEn: "EGYPT",
      nameAr: "مصر",
    });
  });

  it("returns null for empty input", () => {
    expect(parseCountryLabel("   ")).toBeNull();
  });
});

describe("parseDestinationCountriesSheet", () => {
  async function sheetFromRows(
    rows: [string, string][],
  ): Promise<ExcelJS.Worksheet> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("test");
    sheet.addRow(["اسم الدولة", "متطلبات التطعيم"]);
    for (const row of rows) {
      sheet.addRow(row);
    }
    return sheet;
  }

  it("parses data rows", async () => {
    const sheet = await sheetFromRows([
      ["AFGHANISTAN - أفغانستان", "حمى صفراء - ملاريا"],
      ["ALBANIA - ألبانيا", "لا يوجد"],
    ]);
    const { rows, errors } = parseDestinationCountriesSheet(sheet);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: "afghanistan",
      nameEn: "AFGHANISTAN",
      nameAr: "أفغانستان",
      requirementsAr: "حمى صفراء - ملاريا",
      sortOrder: 1,
    });
    expect(rows[1]?.requirementsAr).toBe("لا يوجد");
  });

  it("reports duplicate countries", async () => {
    const sheet = await sheetFromRows([
      ["EGYPT - مصر", "لا يوجد"],
      ["EGYPT - مصر", "شلل أطفال"],
    ]);
    const { rows, errors } = parseDestinationCountriesSheet(sheet);
    expect(rows).toHaveLength(1);
    expect(errors.some((e) => e.includes("تكرار"))).toBe(true);
  });
});

describe("buildDestinationCountriesImportPreview", () => {
  const existing: DestinationCountry[] = [
    {
      id: "egypt",
      nameEn: "EGYPT",
      nameAr: "مصر",
      requirementsAr: "لا يوجد",
      sortOrder: 1,
    },
    {
      id: "jordan",
      nameEn: "JORDAN",
      nameAr: "الأردن",
      requirementsAr: "شلل أطفال",
      sortOrder: 2,
    },
  ];

  it("classifies bootstrap rows as creates", () => {
    const preview = buildDestinationCountriesImportPreview(
      [
        {
          id: "egypt",
          nameEn: "EGYPT",
          nameAr: "مصر",
          requirementsAr: "لا يوجد",
          sortOrder: 1,
        },
      ],
      [],
      [],
    );
    expect(preview.mode).toBe("bootstrap");
    expect(preview.summary.create).toBe(1);
    expect(preview.creates[0]?.kind).toBe("create");
  });

  it("classifies updates, unchanged, and unknown countries", () => {
    const preview = buildDestinationCountriesImportPreview(
      [
        {
          id: "egypt",
          nameEn: "EGYPT",
          nameAr: "مصر",
          requirementsAr: "حمى صفراء",
          sortOrder: 1,
        },
        {
          id: "jordan",
          nameEn: "JORDAN",
          nameAr: "الأردن",
          requirementsAr: "شلل أطفال",
          sortOrder: 2,
        },
        {
          id: "unknown",
          nameEn: "UNKNOWN",
          nameAr: "غير معروف",
          requirementsAr: "لا يوجد",
          sortOrder: 3,
        },
      ],
      existing,
      ["صف 9: تكرار للدولة «EGYPT»."],
    );
    expect(preview.mode).toBe("update");
    expect(preview.summary.update).toBe(1);
    expect(preview.updates[0]).toMatchObject({
      id: "egypt",
      currentRequirementsAr: "لا يوجد",
      newRequirementsAr: "حمى صفراء",
    });
    expect(preview.summary.unchanged).toBe(1);
    expect(preview.summary.error).toBe(2);
    expect(preview.errors.some((e) => e.nameEn === "UNKNOWN")).toBe(true);
  });
});

describe("buildDestinationCountriesExportXlsx", () => {
  it("exports countries in import-compatible format", async () => {
    const buffer = await buildDestinationCountriesExportXlsx([
      {
        id: "jordan",
        nameEn: "JORDAN",
        nameAr: "الأردن",
        requirementsAr: "شلل أطفال",
        sortOrder: 2,
      },
      {
        id: "egypt",
        nameEn: "EGYPT",
        nameAr: "مصر",
        requirementsAr: "لا يوجد",
        sortOrder: 1,
      },
    ]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
    const sheet = workbook.worksheets[0]!;
    const { rows, errors } = parseDestinationCountriesSheet(sheet);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: "egypt",
      requirementsAr: "لا يوجد",
    });
    expect(rows[1]).toMatchObject({
      id: "jordan",
      requirementsAr: "شلل أطفال",
    });
    expect(
      destinationCountryExcelLabel(rows[0]!.nameEn, rows[0]!.nameAr),
    ).toBe("EGYPT - مصر");
  });
});

describe("buildDestinationCountriesTemplateXlsx", () => {
  it("creates a workbook with Arabic headers", async () => {
    const buffer = await buildDestinationCountriesTemplateXlsx();
    expect(buffer.subarray(0, 2).toString()).toBe("PK");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
    const sheet = workbook.worksheets[0];
    expect(sheet?.getRow(1).getCell(1).value).toBe("اسم الدولة");
    expect(sheet?.getRow(1).getCell(2).value).toBe("متطلبات التطعيم");
    expect(String(sheet?.getRow(2).getCell(1).value)).toContain("EGYPT");
  });
});
