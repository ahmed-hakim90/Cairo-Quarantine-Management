import { normalizeArabic } from "@/lib/chat/normalize-arabic";

const HANDOFF_PHRASES = [
  "اكلم حد",
  "اكلم شخص",
  "عايز اكلم",
  "عايز اتواصل",
  "محتاج اكلم",
  "محتاج اتواصل",
  "محتاج اتواصل مع",
  "تواصل مع حد",
  "تواصل مع شخص",
  "اتواصل مع حد",
  "اتواصل مع شخص",
  "اتكلم مع",
  "تحدث مع",
  "اريد التحدث",
  "خدمه عملاء",
  "خدمة عملاء",
  "موظف",
  "مسؤول",
  "انسان",
  "بشري",
  "speak to",
  "talk to someone",
  "talk to a person",
  "human agent",
  "real person",
  "customer service",
  "live agent",
  "parler a",
  "agent humain",
  "service client",
  "人工客服",
  "转人工",
  "联系人工",
];

const BOOKING_ONLY = ["حجز", "موعد", "booking", "appointment", "rendez"];

function hasBookingIntent(normalized: string): boolean {
  return BOOKING_ONLY.some((w) => normalized.includes(normalizeArabic(w)));
}

export function isHumanHandoffRequest(message: string): boolean {
  const normalized = normalizeArabic(message);
  if (!normalized) return false;

  const matched = HANDOFF_PHRASES.some((phrase) =>
    normalized.includes(normalizeArabic(phrase)),
  );
  if (matched) return true;

  if (hasBookingIntent(normalized)) return false;

  return false;
}
