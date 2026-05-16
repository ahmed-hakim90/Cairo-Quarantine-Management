import { describe, expect, it } from "vitest";
import {
  isLastExportCursorPage,
  maxExportScanPages,
  shouldStopExportCursorPagination,
  SUPER_ADMIN_EXPORT_PAGE_SIZE,
} from "@/lib/office-requests/super-admin-export-pagination";

describe("shouldStopExportCursorPagination", () => {
  const pageSize = SUPER_ADMIN_EXPORT_PAGE_SIZE;

  it("does not stop when not using cursor pagination", () => {
    expect(
      shouldStopExportCursorPagination({
        usesCursorPagination: false,
        snapEmpty: true,
        snapSize: 0,
        pageSize,
      }),
    ).toBe(false);
  });

  it("stops on empty snapshot when cursor pagination is active", () => {
    expect(
      shouldStopExportCursorPagination({
        usesCursorPagination: true,
        snapEmpty: true,
        snapSize: 0,
        pageSize,
      }),
    ).toBe(true);
  });

  it("does not stop before reading a partial page", () => {
    expect(
      shouldStopExportCursorPagination({
        usesCursorPagination: true,
        snapEmpty: false,
        snapSize: pageSize - 1,
        pageSize,
      }),
    ).toBe(false);
  });
});

describe("isLastExportCursorPage", () => {
  const pageSize = SUPER_ADMIN_EXPORT_PAGE_SIZE;

  it("detects partial last page after processing", () => {
    expect(isLastExportCursorPage(pageSize - 1, pageSize)).toBe(true);
    expect(isLastExportCursorPage(pageSize, pageSize)).toBe(false);
  });
});

describe("maxExportScanPages", () => {
  it("caps scan depth for export", () => {
    expect(maxExportScanPages(10_000, 400)).toBe(26);
  });
});
