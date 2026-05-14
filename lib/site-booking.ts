import type { Locale } from "@/lib/i18n/config";

export function getVaccinationBookingFormUrl(locale: Locale): string {
  return `/${locale}/booking`;
}
