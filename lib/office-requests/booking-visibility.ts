import type { OfficeRequest } from "@/lib/office-requests/types";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export type AdminBookingVisibilityOptions = {
  todayYmd: string;
  bookingDateFrom?: string | null;
  bookingDateTo?: string | null;
};

function validYmd(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v && YMD.test(v) ? v : null;
}

export function isAdminVisibleBookingRequest(
  request: OfficeRequest,
  options: AdminBookingVisibilityOptions,
): boolean {
  if (request.type !== "booking") return true;

  const preferredDate = validYmd(request.preferredDate);
  if (!preferredDate) return false;

  const requestedFrom = validYmd(options.bookingDateFrom);
  const from =
    requestedFrom && requestedFrom > options.todayYmd
      ? requestedFrom
      : options.todayYmd;
  const to = validYmd(options.bookingDateTo);
  if (preferredDate < from) return false;
  if (to && preferredDate > to) return false;
  return true;
}
