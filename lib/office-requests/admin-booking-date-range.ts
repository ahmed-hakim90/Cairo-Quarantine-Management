import { getCairoTodayYmd, getCairoYesterdayYmd } from "@/lib/cairo-today-ymd";
import { parseExportCreatedBounds } from "@/lib/office-requests/export-date-bounds";

export type AdminBookingDateRange =
  | "all"
  | "today"
  | "yesterday"
  | "today_yesterday";

export const ADMIN_BOOKING_DATE_RANGES = new Set<string>([
  "all",
  "today",
  "yesterday",
  "today_yesterday",
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
  options?: { todayYmd?: string; yesterdayYmd?: string },
): BookingDateYmdRange | null {
  if (dateRange === "all") return null;

  const todayYmd = options?.todayYmd ?? getCairoTodayYmd();
  const yesterdayYmd = options?.yesterdayYmd ?? getCairoYesterdayYmd();
  let fromYmd: string;
  let toYmd: string;
  if (dateRange === "today") {
    fromYmd = todayYmd;
    toYmd = todayYmd;
  } else if (dateRange === "yesterday") {
    fromYmd = yesterdayYmd;
    toYmd = yesterdayYmd;
  } else {
    fromYmd = yesterdayYmd;
    toYmd = todayYmd;
  }

  return { fromYmd, toYmd };
}

export function resolveCustomBookingDateRange(
  fromRaw: string | undefined,
  toRaw: string | undefined,
): BookingDateYmdRange | null {
  const from = fromRaw?.trim() || undefined;
  const to = toRaw?.trim() || undefined;
  if (!from && !to) return null;

  const fromYmd = from ?? to;
  const toYmd = to ?? from;
  if (!fromYmd || !toYmd) return null;

  const parsed = parseExportCreatedBounds(fromYmd, toYmd);
  if ("error" in parsed) return null;
  return { fromYmd, toYmd };
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
