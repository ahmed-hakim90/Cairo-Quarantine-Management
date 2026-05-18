import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { officeRequestsToXlsxBuffer } from "@/lib/office-requests/export-xlsx";
import type { OfficeRequest } from "@/lib/office-requests/types";

const request: OfficeRequest = {
  id: "req-1",
  requestNumber: "CQM-1",
  governorateId: "cairo",
  officeId: "office-1",
  officeNameAr: "مكتب القاهرة",
  type: "booking",
  travelerStateId: "state-1",
  preferredDate: "2026-05-20",
  status: "new",
  name: "أحمد علي",
  phone: "201000000000",
  details: "تفاصيل الطلب",
  notes: "",
  hasSpecialNeeds: true,
  hasElderly: true,
  createdAt: "2026-05-18T10:00:00.000Z",
  updatedAt: "2026-05-18T10:05:00.000Z",
};

describe("officeRequestsToXlsxBuffer", () => {
  it("creates a readable XLSX workbook with Arabic headers", async () => {
    const buffer = await officeRequestsToXlsxBuffer([request], {
      "state-1": "مسافر دولي",
    });

    expect(buffer.subarray(0, 2).toString()).toBe("PK");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
    const sheet = workbook.getWorksheet("الطلبات");

    expect(sheet?.getRow(1).getCell(1).value).toBe("المحافظة");
    expect(sheet?.getRow(2).getCell(1).value).toBe("القاهرة");
    expect(sheet?.getRow(1).getCell(2).value).toBe("معرف المكتب");
    expect(sheet?.getRow(2).getCell(3).value).toBe("مكتب القاهرة");
    expect(sheet?.getRow(2).getCell(5).value).toBe("مسافر دولي");
    expect(sheet?.getRow(1).getCell(11).value).toBe("كبار السن");
    expect(sheet?.getRow(2).getCell(10).value).toBe("نعم");
    expect(sheet?.getRow(2).getCell(11).value).toBe("نعم");
  });
});
