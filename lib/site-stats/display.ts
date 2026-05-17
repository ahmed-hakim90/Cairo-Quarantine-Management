import type { Locale } from "@/lib/i18n/config";

export const SITE_VISITOR_MIN_DISPLAY = 100;

function intlLocale(locale: Locale): string {
  if (locale === "ar") return "ar-EG";
  if (locale === "zh") return "zh-CN";
  return "en-EG";
}

export function formatSiteVisitorDisplay(count: number, locale: Locale): string {
  if (count < SITE_VISITOR_MIN_DISPLAY) return "100+";
  const formatted = new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(count);
  return `${formatted}+`;
}
