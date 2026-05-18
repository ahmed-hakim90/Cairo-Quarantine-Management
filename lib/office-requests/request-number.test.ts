import { describe, expect, it } from "vitest";
import {
  formatRequestNumber,
  requestNumberLookupVariants,
} from "@/lib/office-requests/request-number";

describe("formatRequestNumber", () => {
  it("creates padded public request numbers per office", () => {
    expect(formatRequestNumber("cairo-trav-17", 1)).toBe(
      "cairo-trav-17-000001",
    );
    expect(formatRequestNumber("cairo-trav-17", 123)).toBe(
      "cairo-trav-17-000123",
    );
    expect(formatRequestNumber("cairo-trav-17", 1234567)).toBe(
      "cairo-trav-17-1234567",
    );
  });

  it("allows each office to start from the same sequence", () => {
    expect(formatRequestNumber("cairo-trav-1", 1)).toBe(
      "cairo-trav-1-000001",
    );
    expect(formatRequestNumber("cairo-trav-17", 1)).toBe(
      "cairo-trav-17-000001",
    );
  });
});

describe("requestNumberLookupVariants", () => {
  it("keeps legacy CQM numeric lookup variants", () => {
    expect(requestNumberLookupVariants("17")).toEqual([
      "17",
      "CQM-000017",
    ]);
  });

  it("keeps exact office-prefixed request numbers searchable", () => {
    expect(requestNumberLookupVariants(" cairo-trav-17-000001 ")).toEqual([
      "cairo-trav-17-000001",
      "CAIRO-TRAV-17-000001",
      "17000001",
      "CQM-17000001",
    ]);
  });
});
