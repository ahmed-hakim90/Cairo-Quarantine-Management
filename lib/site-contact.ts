/**
 * رقم واتساب الشكاوى والاقتراحات: أرقام فقط مع كود الدولة (مثال مصر: 201012345678).
 * يُفضَّل ضبط NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE في `.env.local`.
 */
const INLINE_WHATSAPP_COMPLAINTS = "";

export function getWhatsappComplaintsDigits(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE?.replace(/\D/g, "") ?? "";
  const inline = INLINE_WHATSAPP_COMPLAINTS.replace(/\D/g, "");
  return fromEnv || inline;
}

/** Display format for chat fallback messages, e.g. +20 10 1234 5678 */
export function formatWhatsappDisplayPhone(): string {
  const digits = getWhatsappComplaintsDigits();
  if (!digits) return "+20XXXXXXXXXX";

  if (digits.startsWith("20") && digits.length >= 12) {
    const local = digits.slice(2);
    if (local.length === 10) {
      return `+20 ${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
    }
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+20 ${digits.slice(1, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }

  return digits.startsWith("+") ? digits : `+${digits}`;
}
