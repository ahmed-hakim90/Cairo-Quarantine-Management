import { Timestamp } from "firebase-admin/firestore";

/** مصر: توقيت قياسي UTC+2 (بدون DST حالياً). */
const CAIRO_OFFSET = "+02:00";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

function parseYmd(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (!YMD.test(v)) return null;
  return v;
}

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
  const fromStr = parseYmd(fromRaw ?? null);
  const toStr = parseYmd(toRaw ?? null);

  if ((fromRaw?.trim() && !fromStr) || (toRaw?.trim() && !toStr)) {
    return { error: "صيغة التاريخ غير صالحة (استخدم YYYY-MM-DD)." };
  }

  if (!fromStr && !toStr) {
    return { createdFrom: null, createdTo: null };
  }

  let createdFrom: Timestamp | null = null;
  let createdTo: Timestamp | null = null;

  if (fromStr) {
    const start = new Date(`${fromStr}T00:00:00.000${CAIRO_OFFSET}`);
    createdFrom = Timestamp.fromDate(start);
  }
  if (toStr) {
    const end = new Date(`${toStr}T23:59:59.999${CAIRO_OFFSET}`);
    createdTo = Timestamp.fromDate(end);
  }

  if (createdFrom && createdTo && createdFrom.toMillis() > createdTo.toMillis()) {
    return { error: "تاريخ «من» يجب أن يكون قبل أو يساوي تاريخ «إلى»." };
  }

  return { createdFrom, createdTo };
}
