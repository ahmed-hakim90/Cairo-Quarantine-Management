export type AdminBookingDateRange =
  | "all"
  | "today"
  | "yesterday"
  | "today_yesterday";

export function isExplicitBookingDateFilter(args: {
  dateRange: AdminBookingDateRange;
  hasCustomRange: boolean;
}): boolean {
  return args.hasCustomRange || args.dateRange !== "all";
}

export function formatBookingPeriodLabel(args: {
  dateRange: AdminBookingDateRange;
  customFrom?: string;
  customTo?: string;
}): string {
  const { customFrom, customTo } = args;
  if (customFrom || customTo) {
    const from = customFrom ?? customTo!;
    const to = customTo ?? customFrom!;
    if (from === to) return from;
    return `من ${from} إلى ${to}`;
  }

  switch (args.dateRange) {
    case "today":
      return "اليوم";
    case "yesterday":
      return "أمس";
    case "today_yesterday":
      return "اليوم + أمس";
    default:
      return "الكل";
  }
}
