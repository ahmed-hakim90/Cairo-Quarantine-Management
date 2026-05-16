import { describe, expect, it } from "vitest";
import { isAdminVisibleBookingRequest } from "@/lib/office-requests/booking-visibility";
import type { OfficeRequest } from "@/lib/office-requests/types";

function request(
  id: string,
  type: OfficeRequest["type"],
  opts?: { preferredDate?: string; createdAt?: string },
): OfficeRequest {
  const createdAt = opts?.createdAt ?? "2026-05-15T12:00:00.000Z";
  return {
    id,
    officeId: "office-a",
    officeNameAr: "مكتب أ",
    type,
    ...(opts?.preferredDate ? { preferredDate: opts.preferredDate } : {}),
    status: "new",
    name: "",
    phone: "",
    details: "",
    notes: "",
    createdAt,
    updatedAt: createdAt,
  };
}

describe("isAdminVisibleBookingRequest", () => {
  it("hides bookings before today", () => {
    expect(
      isAdminVisibleBookingRequest(
        request("old", "booking", { preferredDate: "2026-05-15" }),
        { todayYmd: "2026-05-16" },
      ),
    ).toBe(false);
  });

  it("shows bookings for today or later", () => {
    expect(
      isAdminVisibleBookingRequest(
        request("today", "booking", { preferredDate: "2026-05-16" }),
        { todayYmd: "2026-05-16" },
      ),
    ).toBe(true);
    expect(
      isAdminVisibleBookingRequest(
        request("future", "booking", { preferredDate: "2026-05-17" }),
        { todayYmd: "2026-05-16" },
      ),
    ).toBe(true);
  });

  it("uses a custom preferredDate range for bookings", () => {
    const options = {
      todayYmd: "2026-05-16",
      bookingDateFrom: "2026-05-20",
      bookingDateTo: "2026-05-22",
    };

    expect(
      isAdminVisibleBookingRequest(
        request("before", "booking", { preferredDate: "2026-05-19" }),
        options,
      ),
    ).toBe(false);
    expect(
      isAdminVisibleBookingRequest(
        request("inside", "booking", { preferredDate: "2026-05-21" }),
        options,
      ),
    ).toBe(true);
    expect(
      isAdminVisibleBookingRequest(
        request("after", "booking", { preferredDate: "2026-05-23" }),
        options,
      ),
    ).toBe(false);
  });

  it("does not show past bookings even when the selected range includes them", () => {
    const options = {
      todayYmd: "2026-05-16",
      bookingDateFrom: "2026-05-14",
      bookingDateTo: "2026-05-16",
    };

    expect(
      isAdminVisibleBookingRequest(
        request("past", "booking", { preferredDate: "2026-05-15" }),
        options,
      ),
    ).toBe(false);
    expect(
      isAdminVisibleBookingRequest(
        request("today", "booking", { preferredDate: "2026-05-16" }),
        options,
      ),
    ).toBe(true);
  });

  it("shows complaints without an explicit date window", () => {
    expect(
      isAdminVisibleBookingRequest(request("complaint", "complaint"), {
        todayYmd: "2026-05-16",
      }),
    ).toBe(true);
  });

  it("filters complaints by createdAt in Cairo when a date window is set", () => {
    const tomorrowFilter = {
      todayYmd: "2026-05-16",
      bookingDateFrom: "2026-05-17",
      bookingDateTo: "2026-05-17",
    };

    expect(
      isAdminVisibleBookingRequest(
        request("complaint-today", "complaint", {
          createdAt: "2026-05-16T12:00:00.000Z",
        }),
        tomorrowFilter,
      ),
    ).toBe(false);
    expect(
      isAdminVisibleBookingRequest(
        request("complaint-tomorrow", "complaint", {
          createdAt: "2026-05-17T12:00:00.000Z",
        }),
        tomorrowFilter,
      ),
    ).toBe(true);
    expect(
      isAdminVisibleBookingRequest(
        request("proposal-tomorrow", "proposal", {
          createdAt: "2026-05-17T12:00:00.000Z",
        }),
        tomorrowFilter,
      ),
    ).toBe(true);
  });
});
