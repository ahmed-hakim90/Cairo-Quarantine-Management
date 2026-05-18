import { getTravelerVaccinationsOfficeCharter } from "@/data/traveler-vaccinations-office-charter";
import type { Locale } from "@/lib/i18n/config";

/** مطار القاهرة — مركز التطعيم يعمل على مدار الساعة (انظر الميثاق). */
export const CAIRO_AIRPORT_VACCINATION_OFFICE_ID = "cairo-trav-1";

/** سطر مواعيد العمل المختصر لعرضه في جداول المكاتب العامة. */
export function getOfficeWorkingHoursTableLabel(
  officeId: string,
  locale: Locale,
): string {
  const hours = getTravelerVaccinationsOfficeCharter(locale).workingHours;
  if (officeId === CAIRO_AIRPORT_VACCINATION_OFFICE_ID) {
    return hours.airportTableLine;
  }
  return `${hours.from} – ${hours.to} (${hours.except})`;
}
