import { getCairoTodayYmd, getCairoTomorrowYmd } from "@/lib/cairo-today-ymd";
import { validateYmdRange } from "@/lib/ymd-range";
import type { AdminBookingDateRange } from "@/lib/office-requests/admin-booking-date-range-ui";

export type { AdminBookingDateRange } from "@/lib/office-requests/admin-booking-date-range-ui";
export {
  formatBookingPeriodLabel,
  isExplicitBookingDateFilter,
} from "@/lib/office-requests/admin-booking-date-range-ui";

export const ADMIN_BOOKING_DATE_RANGES = new Set<string>([
  "all",
  "today",
  "tomorrow",
]);

export type BookingDateYmdRange = {
  fromYmd: string;
  toYmd: string;
};

export type ParsedAdminBookingDateParams = {
  dateRange: AdminBookingDateRange;
  bookingDateRange: BookingDateYmdRange | null;
  hasCustomRange: boolean;
  customDateFrom?: string;
  customDateTo?: string;
  invalid: boolean;
};

export function resolveBookingDateRange(
  dateRange: AdminBookingDateRange,
  options?: { todayYmd?: string; tomorrowYmd?: string },
): BookingDateYmdRange | null {
  if (dateRange === "all") return null;

  const todayYmd = options?.todayYmd ?? getCairoTodayYmd();
  const tomorrowYmd = options?.tomorrowYmd ?? getCairoTomorrowYmd();
  if (dateRange === "today") {
    return { fromYmd: todayYmd, toYmd: todayYmd };
  }
  return { fromYmd: tomorrowYmd, toYmd: tomorrowYmd };
}

export function resolveCustomBookingDateRange(
  fromRaw: string | undefined,
  toRaw: string | undefined,
): BookingDateYmdRange | null {
  const validated = validateYmdRange(fromRaw, toRaw);
  if (!validated || "error" in validated) return null;
  return { fromYmd: validated.fromYmd, toYmd: validated.toYmd };
}

export function parseAdminBookingDateParams(args: {
  rawRange?: string | null;
  rawFrom?: string | null;
  rawTo?: string | null;
}): ParsedAdminBookingDateParams {
  const rawFrom = args.rawFrom?.trim() || undefined;
  const rawTo = args.rawTo?.trim() || undefined;
  const hasCustomRange = Boolean(rawFrom || rawTo);
  const customRange = resolveCustomBookingDateRange(rawFrom, rawTo);

  if (hasCustomRange && !customRange) {
    return {
      dateRange: "all",
      bookingDateRange: null,
      hasCustomRange: true,
      invalid: true,
    };
  }

  const rawRange = args.rawRange?.trim();
  const dateRange: AdminBookingDateRange =
    !hasCustomRange && rawRange && ADMIN_BOOKING_DATE_RANGES.has(rawRange)
      ? (rawRange as AdminBookingDateRange)
      : "all";

  const quickRange = resolveBookingDateRange(dateRange);
  const bookingDateRange = customRange ?? quickRange;

  if (dateRange !== "all" && !bookingDateRange) {
    return {
      dateRange,
      bookingDateRange: null,
      hasCustomRange,
      invalid: true,
    };
  }

  return {
    dateRange,
    bookingDateRange,
    hasCustomRange,
    customDateFrom: customRange?.fromYmd,
    customDateTo: customRange?.toYmd,
    invalid: false,
  };
}
