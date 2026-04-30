/**
 * رابط نموذج حجز التطعيم (Google Form).
 * ضبط NEXT_PUBLIC_VACCINATION_BOOKING_FORM_URL في `.env.local`.
 */
export function getVaccinationBookingFormUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_VACCINATION_BOOKING_FORM_URL?.trim() ?? "";
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}
