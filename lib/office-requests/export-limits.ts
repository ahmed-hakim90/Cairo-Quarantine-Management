/** أقصى عدد صفوف يُصدَّر في ملف واحد (حماية من الاستهلاك الزائد). */
export const SUPER_ADMIN_EXPORT_MAX_ROWS = 10_000;

/** أقصى عدد وثائق لكل طلب استيراد (حجم الجسم والوقت). */
export const SUPER_ADMIN_IMPORT_MAX_DOCS = 2_000;

/** أقصى عدد وثائق يُحذف في طلب تفريغ واحد (مهلة الخادم). */
export const SUPER_ADMIN_PURGE_MAX_DOCS_PER_CALL = 5_000;
