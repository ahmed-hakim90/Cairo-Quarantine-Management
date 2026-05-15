/** ثوابت واجهة سوبر أدمن — بدون firebase-admin (آمن للاستيراد من مكوّنات عميل). */

export const SUPER_ADMIN_DATA_COLLECTION_PATHS = {
  requests: "requests",
  activityLogs: "activityLogs",
  offices: "offices",
  messageTemplates: "messageTemplates",
} as const;

export type SuperAdminDataCollectionKey =
  keyof typeof SUPER_ADMIN_DATA_COLLECTION_PATHS;

export const SUPER_ADMIN_PURGABLE_COLLECTION_KEYS = [
  "requests",
  "activityLogs",
] as const;

export type SuperAdminPurgableCollectionKey =
  (typeof SUPER_ADMIN_PURGABLE_COLLECTION_KEYS)[number];

export function isSuperAdminDataCollectionKey(
  value: string,
): value is SuperAdminDataCollectionKey {
  return (
    value === "requests" ||
    value === "activityLogs" ||
    value === "offices" ||
    value === "messageTemplates"
  );
}

export function isSuperAdminPurgableCollectionKey(
  value: string,
): value is SuperAdminPurgableCollectionKey {
  return value === "requests" || value === "activityLogs";
}

export const SUPER_ADMIN_PURGE_OPERATIONS = [
  "activity_log",
  "requests_all",
  "requests_complaints",
  "requests_proposals",
] as const;

export type SuperAdminPurgeOperationId =
  (typeof SUPER_ADMIN_PURGE_OPERATIONS)[number];

export const SUPER_ADMIN_PURGE_CONFIRM_PHRASE: Record<
  SuperAdminPurgeOperationId,
  string
> = {
  activity_log: "أؤكد حذف سجل الإجراءات بالكامل",
  requests_all: "أؤكد حذف جميع الطلبات",
  requests_complaints: "أؤكد حذف جميع الشكاوى",
  requests_proposals: "أؤكد حذف جميع المقترحات",
};

export function isSuperAdminPurgeOperationId(
  value: string,
): value is SuperAdminPurgeOperationId {
  return (SUPER_ADMIN_PURGE_OPERATIONS as readonly string[]).includes(value);
}

export const EXPORT_FILE_STEM_AR: Record<SuperAdminDataCollectionKey, string> =
  {
    requests: "نسخة-طلبات",
    activityLogs: "نسخة-سجل-اجراءات",
    offices: "نسخة-مكاتب",
    messageTemplates: "نسخة-قوالب-رسائل",
  };
