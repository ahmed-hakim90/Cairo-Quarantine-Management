import { describe, expect, it } from "vitest";
import { isAdminVisibleBookingRequest } from "@/lib/office-requests/booking-visibility";
import type { OfficeRequest } from "@/lib/office-requests/types";

function request(
  id: string,
  type: OfficeRequest["type"],
  preferredDate?: string,
): OfficeRequest {
  return {
    id,
    officeId: "office-a",
    officeNameAr: "مكتب أ",
    type,
    ...(preferredDate ? { preferredDate } : {}),
    status: "new",
    name: "",
    phone: "",
    details: "",
    notes: "",
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
  };
}

describe("isAdminVisibleBookingRequest", () => {
  it("hides bookings before today", () => {
    expect(
      isAdminVisibleBookingRequest(request("old", "booking", "2026-05-15"), {
        todayYmd: "2026-05-16",
      }),
    ).toBe(false);
  });

  it("shows bookings for today or later", () => {
    expect(
      isAdminVisibleBookingRequest(request("today", "booking", "2026-05-16"), {
        todayYmd: "2026-05-16",
      }),
    ).toBe(true);
    expect(
      isAdminVisibleBookingRequest(request("future", "booking", "2026-05-17"), {
        todayYmd: "2026-05-16",
      }),
    ).toBe(true);
  });

  it("uses a custom preferredDate range for bookings", () => {
    const options = {
      todayYmd: "2026-05-16",
      bookingDateFrom: "2026-05-20",
      bookingDateTo: "2026-05-22",
    };

    expect(
      isAdminVisibleBookingRequest(request("before", "booking", "2026-05-19"), options),
    ).toBe(false);
    expect(
      isAdminVisibleBookingRequest(request("inside", "booking", "2026-05-21"), options),
    ).toBe(true);
    expect(
      isAdminVisibleBookingRequest(request("after", "booking", "2026-05-23"), options),
    ).toBe(false);
  });

  it("does not show past bookings even when the selected range includes them", () => {
    const options = {
      todayYmd: "2026-05-16",
      bookingDateFrom: "2026-05-14",
      bookingDateTo: "2026-05-16",
    };

    expect(
      isAdminVisibleBookingRequest(request("past", "booking", "2026-05-15"), options),
    ).toBe(false);
    expect(
      isAdminVisibleBookingRequest(request("today", "booking", "2026-05-16"), options),
    ).toBe(true);
  });

  it("does not hide complaints or proposals", () => {
    const options = {
      todayYmd: "2026-05-16",
      bookingDateFrom: "2026-05-20",
      bookingDateTo: "2026-05-22",
    };

    expect(
      isAdminVisibleBookingRequest(request("complaint", "complaint"), options),
    ).toBe(true);
    expect(
      isAdminVisibleBookingRequest(request("proposal", "proposal"), options),
    ).toBe(true);
  });
});
