import { describe, expect, it } from "vitest";
import {
  isBookingDayFull,
  parseBookingDayStats,
} from "@/lib/office-requests/booking-day-stats";

describe("booking day stats", () => {
  it("detects full day", () => {
    expect(isBookingDayFull(10, 10)).toBe(true);
    expect(isBookingDayFull(9, 10)).toBe(false);
    expect(isBookingDayFull(0, 0)).toBe(false);
  });

  it("parses stats with defaults", () => {
    expect(
      parseBookingDayStats("office-a", "2026-06-01", { used: 3 }, 20),
    ).toEqual({
      officeId: "office-a",
      date: "2026-06-01",
      cap: 20,
      used: 3,
    });
  });
});
