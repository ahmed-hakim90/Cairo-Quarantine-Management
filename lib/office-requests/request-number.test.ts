import { describe, expect, it } from "vitest";
import { formatRequestNumber } from "@/lib/office-requests/request-number";

describe("formatRequestNumber", () => {
  it("creates padded public request numbers", () => {
    expect(formatRequestNumber(1)).toBe("CQM-000001");
    expect(formatRequestNumber(123)).toBe("CQM-000123");
    expect(formatRequestNumber(1234567)).toBe("CQM-1234567");
  });
});

