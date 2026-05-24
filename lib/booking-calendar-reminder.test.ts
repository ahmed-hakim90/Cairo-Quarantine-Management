import { describe, expect, it } from "vitest";
import {
  buildBookingReminderIcs,
  buildGoogleCalendarReminderUrl,
  icsAllDayEndDate,
  ymdToIcsDate,
} from "@/lib/booking-calendar-reminder";

describe("booking calendar reminder", () => {
  it("converts ymd to ics date", () => {
    expect(ymdToIcsDate("2026-05-25")).toBe("20260525");
    expect(ymdToIcsDate("bad")).toBeNull();
  });

  it("computes all-day end date", () => {
    expect(icsAllDayEndDate("2026-05-25")).toBe("20260526");
    expect(icsAllDayEndDate("2026-12-31")).toBe("20270101");
  });

  it("builds ics with summary and description", () => {
    const ics = buildBookingReminderIcs({
      requestId: "abc123",
      preferredDate: "2026-05-25",
      title: "موعد الحجز",
      description: "طلب #abc123",
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260525");
    expect(ics).toContain("DTEND;VALUE=DATE:20260526");
    expect(ics).toContain("SUMMARY:موعد الحجز");
  });

  it("builds google calendar url", () => {
    const url = buildGoogleCalendarReminderUrl({
      requestId: "abc123",
      preferredDate: "2026-05-25",
      title: "Booking",
      description: "Request abc123",
    });
    expect(url).toContain("calendar.google.com");
    expect(url).toContain("dates=20260525%2F20260526");
  });
});
