import { getCairoTodayYmd } from "@/lib/cairo-today-ymd";
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

function cairoYmdFromIso(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return getCairoTodayYmd(d);
}

function explicitYmdBounds(
  bookingDateFrom?: string | null,
  bookingDateTo?: string | null,
): { from: string; to: string } | null {
  const from = validYmd(bookingDateFrom);
  const to = validYmd(bookingDateTo);
  if (!from && !to) return null;
  return { from: from ?? to!, to: to ?? from! };
}

function isYmdInRange(ymd: string, from: string, to: string): boolean {
  if (ymd < from) return false;
  if (ymd > to) return false;
  return true;
}

export function isAdminVisibleBookingRequest(
  request: OfficeRequest,
  options: AdminBookingVisibilityOptions,
): boolean {
  if (request.type !== "booking") {
    const bounds = explicitYmdBounds(
      options.bookingDateFrom,
      options.bookingDateTo,
    );
    if (!bounds) return true;

    const createdYmd = cairoYmdFromIso(request.createdAt);
    if (!createdYmd) return false;
    return isYmdInRange(createdYmd, bounds.from, bounds.to);
  }

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
