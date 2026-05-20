import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  buildDestinationCountriesTemplateXlsx,
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
