/**
 * رابط حجز التطعيم / البوابة الإلكترونية الرسمية (Google Sites).
 * يمكن تجاوزه بـ NEXT_PUBLIC_VACCINATION_BOOKING_FORM_URL في `.env.local` أو على الاستضافة.
 */
const DEFAULT_VACCINATION_BOOKING_FORM_URL =
  "https://sites.google.com/view/cairo-quarantine-management/%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A9-%D8%A7%D9%84%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%D8%A9";

export function getVaccinationBookingFormUrl(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_VACCINATION_BOOKING_FORM_URL?.trim();
  const raw =
    fromEnv && fromEnv.length > 0
      ? fromEnv
      : DEFAULT_VACCINATION_BOOKING_FORM_URL;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}
