import { getTravelerVaccinationsOfficeCharter } from "@/data/traveler-vaccinations-office-charter";
import type { Locale } from "@/lib/i18n/config";
import type { Office, OfficeWorkingHours } from "@/lib/office-requests/types";

/** مطار القاهرة — مركز التطعيم يعمل على مدار الساعة (انظر الميثاق). */
export const CAIRO_AIRPORT_VACCINATION_OFFICE_ID = "cairo-trav-1";

export const DEFAULT_WORKING_HOURS_FROM = "08:00";
export const DEFAULT_WORKING_HOURS_TO = "17:00";

const LOCALE_TAG: Record<Locale, string> = {
  ar: "ar-EG",
  en: "en-US",
  zh: "zh-CN",
  fr: "fr-FR",
};

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseHHmm(value: string): number | null {
  const m = HH_MM.exec(value.trim());
  if (!m) return null;
  return Number.parseInt(m[1], 10) * 60 + Number.parseInt(m[2], 10);
}

function formatMinutes(minutes: number, locale: Locale): string {
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  const date = new Date(1970, 0, 1, h, min);
  return date.toLocaleTimeString(LOCALE_TAG[locale], {
    hour: "numeric",
    minute: "2-digit",
    hour12: locale !== "zh",
  });
}

function charterHours(locale: Locale) {
  return getTravelerVaccinationsOfficeCharter(locale).workingHours;
}

function legacyIsTwentyFourSeven(office: Office): boolean {
  return office.id === CAIRO_AIRPORT_VACCINATION_OFFICE_ID;
}

function effectiveTwentyFourSeven(office: Office): boolean {
  if (office.workingHours?.twentyFourSeven === true) return true;
  if (office.workingHours) return false;
  return legacyIsTwentyFourSeven(office);
}

function effectiveFromTo(office: Office): { from: string; to: string } {
  const wh = office.workingHours;
  if (wh?.from && wh?.to) return { from: wh.from, to: wh.to };
  return { from: DEFAULT_WORKING_HOURS_FROM, to: DEFAULT_WORKING_HOURS_TO };
}

function exceptLabel(office: Office, locale: Locale): string {
  const charter = charterHours(locale);
  if (locale === "ar" && office.workingHours?.exceptAr?.trim()) {
    return office.workingHours.exceptAr.trim();
  }
  return charter.except;
}

function formatStructuredHours(office: Office, locale: Locale): string {
  const charter = charterHours(locale);
  if (!office.workingHours) {
    return `${charter.from} – ${charter.to} (${exceptLabel(office, locale)})`;
  }
  const { from, to } = effectiveFromTo(office);
  const fromMin = parseHHmm(from);
  const toMin = parseHHmm(to);
  if (fromMin == null || toMin == null) {
    return `${charter.from} – ${charter.to} (${exceptLabel(office, locale)})`;
  }
  const fromLabel = formatMinutes(fromMin, locale);
  const toLabel = formatMinutes(toMin, locale);
  return `${fromLabel} – ${toLabel} (${exceptLabel(office, locale)})`;
}

/** سطر مواعيد العمل المختصر لعرضه في جداول المكاتب العامة والإدارة. */
export function getOfficeWorkingHoursTableLabel(
  office: Office,
  locale: Locale,
): string {
  if (effectiveTwentyFourSeven(office)) {
    return charterHours(locale).airportTableLine;
  }
  return formatStructuredHours(office, locale);
}

/** معاينة عربية لجدول إدارة المكاتب. */
export function getOfficeWorkingHoursAdminPreview(office: Office): string {
  return getOfficeWorkingHoursTableLabel(office, "ar");
}

export function parseOfficeWorkingHoursFromForm(input: {
  twentyFourSeven: boolean;
  from: string;
  to: string;
  exceptAr: string;
}): OfficeWorkingHours | undefined {
  if (input.twentyFourSeven) {
    return { twentyFourSeven: true };
  }

  const from = input.from.trim() || DEFAULT_WORKING_HOURS_FROM;
  const to = input.to.trim() || DEFAULT_WORKING_HOURS_TO;
  if (!HH_MM.test(from) || !HH_MM.test(to)) {
    throw new Error("صيغة وقت مواعيد العمل غير صالحة.");
  }
  const fromMin = parseHHmm(from)!;
  const toMin = parseHHmm(to)!;
  if (fromMin >= toMin) {
    throw new Error("يجب أن يكون وقت البداية قبل وقت النهاية.");
  }

  const exceptAr = input.exceptAr.trim();
  const result: OfficeWorkingHours = { from, to };
  if (exceptAr) result.exceptAr = exceptAr;
  return result;
}

export function isValidHHmm(value: string): boolean {
  return HH_MM.test(value.trim());
}
