/**
 * أرقام العرض في الصفحة الرئيسية.
 *
 * القيم أدناه أرقام توضيحية فقط لشرح شكل البوابة — ليست مستخرجة من تقرير محدد.
 * عند النشر الرسمي: استبدلها بالأرقام المنشورة وحدّث `TRAVELER_STATS_SOURCE_URL`
 * إلى التقرير أو البيان المفتوح (مثلاً وزارة الصحة والسكان، CAPMAS، إلخ).
 *
 * `null` يعرض «قيد التحديث» بدل الرقم.
 */
export type TravelerStatKey = "international" | "hajjUmrah" | "citizen";

/** أمثلة توضيحية بترتيب مغزى: مسار دولي — حج/عمرة — خدمات مواطنين داخل الجمهورية */
export const TRAVELER_STATS_COUNTS: Record<TravelerStatKey, number | null> = {
  international: 1_420_000,
  hajjUmrah: 178_000,
  citizen: 3_650_000,
};

/**
 * مرجع عام للجهة المقصودة (وزارة الصحة والسكان — جمهورية مصر العربية).
 * غيّر الرابط لصفحة أو ملف PDF يحتوي فعليًا على الأرقام المعروضة عند توفره.
 */
export const TRAVELER_STATS_SOURCE_URL: string | null =
  "https://www.mohp.gov.eg/";
