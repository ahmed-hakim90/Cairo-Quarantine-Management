import { describe, expect, it } from "vitest";
import { isBookingDayFull } from "@/lib/office-requests/booking-day-stats";

/**
 * Models concurrent reservation attempts: only one succeeds when one slot remains.
 */
describe("concurrent booking capacity (logic)", () => {
  it("allows only one reservation when one slot remains", () => {
    let used = 9;
    const cap = 10;
    const attempts = [false, false, false].map(() => {
      if (isBookingDayFull(used, cap)) return false;
      used += 1;
      return true;
    });
    expect(attempts.filter(Boolean)).toHaveLength(1);
    expect(used).toBe(10);
  });
});
