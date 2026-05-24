import { describe, expect, it } from "vitest";
import {
  bookingCheckinAllowedForToday,
  bookingDateStatus,
} from "@/lib/queue/checkin-booking-day";

describe("bookingDateStatus", () => {
  it("returns missing when no preferred date", () => {
    expect(bookingDateStatus(undefined, "2026-05-24")).toBe("missing");
    expect(bookingDateStatus("", "2026-05-24")).toBe("missing");
  });

  it("returns today when dates match", () => {
    expect(bookingDateStatus("2026-05-24", "2026-05-24")).toBe("today");
  });

  it("returns future when preferred date is later", () => {
    expect(bookingDateStatus("2026-05-25", "2026-05-24")).toBe("future");
  });

  it("returns past when preferred date is earlier", () => {
    expect(bookingDateStatus("2026-05-23", "2026-05-24")).toBe("past");
  });
});

describe("bookingCheckinAllowedForToday", () => {
  it("allows complaints on any day", () => {
    expect(
      bookingCheckinAllowedForToday(
        { type: "complaint", preferredDate: undefined },
        "2026-05-24",
      ),
    ).toBe(true);
  });

  it("allows bookings on the preferred date", () => {
    expect(
      bookingCheckinAllowedForToday(
        { type: "booking", preferredDate: "2026-05-24" },
        "2026-05-24",
      ),
    ).toBe(true);
  });

  it("rejects bookings before the preferred date", () => {
    expect(
      bookingCheckinAllowedForToday(
        { type: "booking", preferredDate: "2026-05-25" },
        "2026-05-24",
      ),
    ).toBe(false);
  });

  it("rejects bookings after the preferred date", () => {
    expect(
      bookingCheckinAllowedForToday(
        { type: "booking", preferredDate: "2026-05-23" },
        "2026-05-24",
      ),
    ).toBe(false);
  });

  it("rejects bookings without a preferred date", () => {
    expect(
      bookingCheckinAllowedForToday(
        { type: "booking", preferredDate: undefined },
        "2026-05-24",
      ),
    ).toBe(false);
  });
});
