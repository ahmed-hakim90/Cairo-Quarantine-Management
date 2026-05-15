import { Timestamp } from "firebase-admin/firestore";
import { parseExportCreatedBounds } from "@/lib/office-requests/export-date-bounds";

const MAX_RANGE_MS = 90 * 24 * 60 * 60 * 1000;

export type ActivityLogTimeBoundsResult =
  | { ok: true; createdFrom: Timestamp; createdTo: Timestamp }
  | { ok: false; errorMessage: string };

/**
 * يحوّل YYYY-MM-DD (اختياري لكل منهما) إلى حدود Firestore شاملة، مع سقف 90 يوماً
 * عند وجود طرف واحد مفتوح لتجنب مسح مجموعة كاملة بالخطأ.
 */
export function resolveActivityLogFirestoreBounds(
  fromYmd: string,
  toYmd: string,
): ActivityLogTimeBoundsResult {
  const parsed = parseExportCreatedBounds(fromYmd, toYmd);
  if ("error" in parsed) {
    return { ok: false, errorMessage: parsed.error };
  }

  let { createdFrom, createdTo } = parsed;
  const nowMs = Date.now();

  if (!createdFrom && !createdTo) {
    return {
      ok: false,
      errorMessage: "حدد تاريخ «من» أو «إلى».",
    };
  }

  if (createdFrom && createdTo) {
    if (createdFrom.toMillis() > createdTo.toMillis()) {
      return { ok: false, errorMessage: "تاريخ «من» يجب أن يكون قبل أو يساوي تاريخ «إلى»." };
    }
    if (createdTo.toMillis() - createdFrom.toMillis() > MAX_RANGE_MS) {
      return {
        ok: false,
        errorMessage: "الحد الأقصى للفترة 90 يوماً. ضيّق نطاق التاريخ.",
      };
    }
    return { ok: true, createdFrom, createdTo };
  }

  if (createdFrom && !createdTo) {
    const cappedEndMs = Math.min(createdFrom.toMillis() + MAX_RANGE_MS, nowMs);
    createdTo = Timestamp.fromMillis(cappedEndMs);
    return { ok: true, createdFrom, createdTo };
  }

  /* createdTo only */
  const cappedStartMs = Math.max(createdTo!.toMillis() - MAX_RANGE_MS, 0);
  createdFrom = Timestamp.fromMillis(cappedStartMs);
  return { ok: true, createdFrom, createdTo: createdTo! };
}
