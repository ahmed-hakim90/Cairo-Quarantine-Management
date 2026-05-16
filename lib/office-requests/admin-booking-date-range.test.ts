import { describe, expect, it } from "vitest";
import {
  parseAdminBookingDateParams,
  resolveBookingDateRange,
  resolveCustomBookingDateRange,
} from "@/lib/office-requests/admin-booking-date-range";

describe("resolveBookingDateRange", () => {
  it("returns null for all", () => {
    expect(resolveBookingDateRange("all")).toBeNull();
  });

  it("resolves today and yesterday presets", () => {
    expect(
      resolveBookingDateRange("today", {
        todayYmd: "2026-05-16",
        yesterdayYmd: "2026-05-15",
      }),
    ).toEqual({ fromYmd: "2026-05-16", toYmd: "2026-05-16" });
    expect(
      resolveBookingDateRange("yesterday", {
        todayYmd: "2026-05-16",
        yesterdayYmd: "2026-05-15",
      }),
    ).toEqual({ fromYmd: "2026-05-15", toYmd: "2026-05-15" });
    expect(
      resolveBookingDateRange("today_yesterday", {
        todayYmd: "2026-05-16",
        yesterdayYmd: "2026-05-15",
      }),
    ).toEqual({ fromYmd: "2026-05-15", toYmd: "2026-05-16" });
  });
});

describe("resolveCustomBookingDateRange", () => {
  it("returns null when both empty", () => {
    expect(resolveCustomBookingDateRange(undefined, undefined)).toBeNull();
  });

  it("uses single date for both bounds", () => {
    expect(resolveCustomBookingDateRange("2026-05-10", undefined)).toEqual({
      fromYmd: "2026-05-10",
      toYmd: "2026-05-10",
    });
  });

  it("rejects invalid dates", () => {
    expect(resolveCustomBookingDateRange("bad", "2026-05-10")).toBeNull();
  });
});

describe("parseAdminBookingDateParams", () => {
  it("defaults to all with no params", () => {
    expect(parseAdminBookingDateParams({})).toEqual({
      dateRange: "all",
      bookingDateRange: null,
      hasCustomRange: false,
      invalid: false,
    });
  });

  it("parses quick range preset", () => {
    const parsed = parseAdminBookingDateParams({ rawRange: "today" });
    expect(parsed.dateRange).toBe("today");
    expect(parsed.bookingDateRange).not.toBeNull();
    expect(parsed.hasCustomRange).toBe(false);
    expect(parsed.invalid).toBe(false);
  });

  it("prefers custom range over preset", () => {
    const parsed = parseAdminBookingDateParams({
      rawRange: "today",
      rawFrom: "2026-05-01",
      rawTo: "2026-05-05",
    });
    expect(parsed.dateRange).toBe("all");
    expect(parsed.bookingDateRange).toEqual({
      fromYmd: "2026-05-01",
      toYmd: "2026-05-05",
    });
    expect(parsed.hasCustomRange).toBe(true);
    expect(parsed.invalid).toBe(false);
  });

  it("marks invalid custom range", () => {
    expect(
      parseAdminBookingDateParams({ rawFrom: "not-a-date" }).invalid,
    ).toBe(true);
  });

  it("ignores unknown preset", () => {
    expect(parseAdminBookingDateParams({ rawRange: "week" }).dateRange).toBe(
      "all",
    );
  });
});
