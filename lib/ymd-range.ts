const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function parseYmd(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (!YMD.test(v)) return null;
  return v;
}

export type ValidatedYmdRange = {
  fromYmd: string;
  toYmd: string;
};

/**
 * Validates optional from/to YMD query fields.
 * Returns null when both empty; `{ error }` on invalid input or from > to.
 */
export function validateYmdRange(
  fromRaw: string | null | undefined,
  toRaw: string | null | undefined,
): ValidatedYmdRange | { error: string } | null {
  const fromStr = parseYmd(fromRaw ?? null);
  const toStr = parseYmd(toRaw ?? null);

  if ((fromRaw?.trim() && !fromStr) || (toRaw?.trim() && !toStr)) {
    return { error: "صيغة التاريخ غير صالحة (استخدم YYYY-MM-DD)." };
  }

  if (!fromStr && !toStr) return null;

  const fromYmd = fromStr ?? toStr!;
  const toYmd = toStr ?? fromStr!;
  if (fromYmd > toYmd) {
    return { error: "تاريخ «من» يجب أن يكون قبل أو يساوي تاريخ «إلى»." };
  }

  return { fromYmd, toYmd };
}
