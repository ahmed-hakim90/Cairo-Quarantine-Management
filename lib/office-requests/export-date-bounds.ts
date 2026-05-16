import { Timestamp } from "firebase-admin/firestore";
import { validateYmdRange } from "@/lib/ymd-range";

/** مصر: توقيت قياسي UTC+2 (بدون DST حالياً). */
const CAIRO_OFFSET = "+02:00";

export type ExportCreatedBounds = {
  createdFrom: Timestamp | null;
  createdTo: Timestamp | null;
};

/**
 * تحويل حقول التاريخ من الاستعلام إلى حدود Firestore شاملة.
 * يُرجع null عند خطأ التحقق (تاريخ غير صالح أو من بعد إلى).
 */
export function parseExportCreatedBounds(
  fromRaw: string | null | undefined,
  toRaw: string | null | undefined,
): ExportCreatedBounds | { error: string } {
  const validated = validateYmdRange(fromRaw, toRaw);
  if (validated && "error" in validated) return validated;
  if (!validated) {
    return { createdFrom: null, createdTo: null };
  }

  const start = new Date(`${validated.fromYmd}T00:00:00.000${CAIRO_OFFSET}`);
  const end = new Date(`${validated.toYmd}T23:59:59.999${CAIRO_OFFSET}`);
  return {
    createdFrom: Timestamp.fromDate(start),
    createdTo: Timestamp.fromDate(end),
  };
}
