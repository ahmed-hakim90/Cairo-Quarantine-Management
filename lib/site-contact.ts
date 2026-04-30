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
