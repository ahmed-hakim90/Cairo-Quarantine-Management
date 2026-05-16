/** Maps Firestore listener failures to short Arabic messages for admins. */
export function getFirestoreListenerErrorMessage(error: unknown): string {
  const record =
    typeof error === "object" && error !== null
      ? (error as { code?: unknown; message?: unknown })
      : null;
  const code = typeof record?.code === "string" ? record.code : null;
  const message = typeof record?.message === "string" ? record.message : "";

  if (code === "permission-denied") {
    return "صلاحية Firestore مرفوضة. أعد تسجيل الدخول إلى لوحة الإدارة.";
  }
  if (code === "failed-precondition") {
    return "فهرس Firestore مطلوب للإشعار الفوري. انشر firestore.indexes.json من Firebase.";
  }
  if (code === "unavailable") {
    return "Firestore غير متاح مؤقتاً. تحقق من الاتصال وأعد المحاولة.";
  }
  if (code) {
    return message ? `${code}: ${message}` : code;
  }

  if (error instanceof Error && error.message.trim()) {
    if (process.env.NODE_ENV === "development") {
      return `تعذّر تفعيل الإشعار الفوري: ${error.message}`;
    }
    const lower = error.message.toLowerCase();
    if (lower.includes("network") || lower.includes("fetch")) {
      return "تعذّر الاتصال بـ Firestore. تحقق من الشبكة أو إعدادات الحماية (CSP) في المتصفح.";
    }
  }

  return "تعذّر تفعيل الإشعار الفوري (Firestore). أعد تحميل الصفحة.";
}

export function isFirestorePermissionDenied(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "permission-denied"
  );
}
