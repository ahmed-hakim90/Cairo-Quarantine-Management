import type { OfficeRequest } from "@/lib/office-requests/types";

export type BookingDateStatus = "today" | "future" | "past" | "missing";

export function bookingDateStatus(
  preferredDate: string | undefined,
  today: string,
): BookingDateStatus {
  if (!preferredDate?.trim()) return "missing";
  if (preferredDate === today) return "today";
  if (preferredDate > today) return "future";
  return "past";
}

export function bookingCheckinAllowedForToday(
  request: Pick<OfficeRequest, "type" | "preferredDate">,
  today: string,
): boolean {
  if (request.type !== "booking") return true;
  return bookingDateStatus(request.preferredDate, today) === "today";
}
