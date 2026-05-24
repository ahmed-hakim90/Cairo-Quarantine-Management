/** Substrings matched against normalized Arabic/English text (see normalizeArabic). */

export const BOOKING_PATTERNS = [
  "حجز",
  "احجز",
  "عايز احجز",
  "احجزلي",
  "موعد تطعيم",
  "موعد",
  "booking",
  "appointment",
  "reserve",
  "reservation",
];

export const PRICE_PATTERNS = [
  "تكلف",
  "سعر",
  "بكم",
  "بكام",
  "كام الثمن",
  "تكلفه اللقاح",
  "جنيه",
  "egp",
  "مصاريف",
  "price",
  "cost",
  "how much",
  "fee",
];

export const OFFICE_LOCATION_PATTERNS = [
  "اقرب",
  "مكتب",
  "مكاتب",
  "عنوان",
  "فين",
  "اقرب مكان",
  "عنوان المكتب",
  "office",
  "location",
  "branch",
  "where",
];

export const HOURS_PATTERNS = [
  "مواعيد",
  "دوام",
  "شغل",
  "مفتوح",
  "ساعات",
  "امتى مفتوح",
  "بتفتح امتى",
  "working",
  "hours",
  "open",
  "schedule",
];

export const DESTINATION_PATTERNS = [
  "مسافر",
  "سافر",
  "رايح",
  "مسافر على",
  "محتاج تطعيمات",
  "دوله",
  "لقاح",
  "تطعيم",
  "هتطعم",
  "هاخد",
  "محتاج",
  "متطلب",
  "شهاده",
  "فاكسين",
  "vaccine",
  "travel",
  "متطلبات",
  "destination",
  "country",
];

export const CHECKIN_PATTERNS = [
  "تسجيل حضور",
  "سجل حضور",
  "اسجل حضور",
  "ازاي اسجل حضور",
  "طابور",
  "تذكره الطابور",
  "checkin",
  "check in",
  "check-in",
  "queue ticket",
];

export const COMPLAINT_PATTERNS = [
  "شكوى",
  "شكوي",
  "قدم شكوى",
  "عايز اقدم شكوى",
  "تقديم شكوى",
  "complaint",
  "grievance",
];

export const INTERNATIONAL_INFO_PATTERNS = [
  "مسافر دولي",
  "سفر دولي",
  "دولي ايه",
  "international traveler",
  "international travel",
  "before travel",
];

export function normalizedIncludesAny(
  normalized: string,
  patterns: readonly string[],
): boolean {
  return patterns.some((pattern) => {
    const p = pattern.replace(/\s+/g, " ").trim();
    return p.length > 0 && normalized.includes(p);
  });
}
