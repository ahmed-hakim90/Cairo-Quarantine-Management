import type { OfficeWorkingHours } from "@/lib/office-requests/types";

export function formatOfficeWorkingHours(
  hours: OfficeWorkingHours | undefined,
  locale: string,
): string | null {
  if (!hours) return null;
  if (hours.twentyFourSeven) {
    return locale === "ar" ? "على مدار الساعة" : "24/7";
  }
  if (hours.from && hours.to) {
    const base = `${hours.from} – ${hours.to}`;
    if (hours.exceptAr && locale === "ar") return `${base} (${hours.exceptAr})`;
    return base;
  }
  return null;
}
